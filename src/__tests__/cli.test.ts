import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { runGenerateCommand } from "../commands/generate.js";
import { runInitCommand } from "../commands/init.js";
import { prompts } from "../utils/prompts.js";

const execFileAsync = promisify(execFile);
const tempRoots: string[] = [];
const fixtureRoot = path.resolve("fixtures");

async function createRepo(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "repoflow-cli-"));
  tempRoots.push(root);

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = path.join(root, relativePath);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }),
  );

  return root;
}

async function createRepoFromFixture(fixtureName: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "repoflow-fixture-"));
  tempRoots.push(root);
  await fs.copy(path.join(fixtureRoot, fixtureName), root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.remove(root)));
});

describe("CLI", () => {
  it("prints detection results as JSON", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
        },
      }),
      "package-lock.json": "{}",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBeUndefined();
    expect(parsed.packageManager).toBe("npm");
    expect(parsed.testCommand).toBe("npm test");
    expect(parsed.lintCommand).toBeUndefined();
    expect(parsed.typecheckCommand).toBeUndefined();
    expect(parsed.formatCheckCommand).toBeUndefined();
  });

  it("prints workflow preview to stdout", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
        },
      }),
      "yarn.lock": "# yarn lockfile",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("name: CI");
    expect(stdout).toContain("actions/setup-node@v6");
    expect(stdout).toContain("run: yarn install --frozen-lockfile");
    expect(stdout).toContain("run: yarn test");
  });

  it("uses a framework-aware default build command when a next.js project has no build script", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        dependencies: {
          next: "15.0.0",
        },
      }),
      "package-lock.json": "{}",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("run: npm ci");
    expect(stdout).toContain("run: npx next build");
  });

  it("uses a framework-aware default build command when a nestjs project has no build script", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        dependencies: {
          "@nestjs/core": "^11.0.0",
        },
      }),
      "package-lock.json": "{}",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("run: npm ci");
    expect(stdout).toContain("run: npx nest build");
  });

  it("uses a framework-aware default build command when a nuxt project has no build script", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        dependencies: {
          nuxt: "^4.0.0",
        },
      }),
      "package-lock.json": "{}",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("run: npm ci");
    expect(stdout).toContain("run: npx nuxt build");
  });

  it("prints python detection results as JSON", async () => {
    const root = await createRepo({
      "requirements.txt": "pytest==8.3.0\n",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("python");
    expect(parsed.packageManager).toBe("pip");
  });

  it("prints go workflow preview to stdout", async () => {
    const root = await createRepo({
      "go.mod": "module example.com/demo\n\ngo 1.22.3\n",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-go@v5");
    expect(stdout).toContain("run: go mod download");
    expect(stdout).toContain("run: go test ./...");
  });

  it("writes ci.yml when generate runs on a supported project", async () => {
    const root = await createRepo({
      "requirements.txt": "pytest==8.3.0\n",
    });

    await runGenerateCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-python@v5");
    expect(written).toContain("run: pip install -r requirements.txt");
  });

  it("keeps the existing workflow when overwrite is declined", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({ name: "demo" }),
      ".github/workflows/ci.yml": "name: Existing CI\n",
    });

    prompts.inject([false]);

    await runGenerateCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toBe("name: Existing CI\n");
  });

  it("initializes a workflow with the selected branch and build step", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          typecheck: "tsc --noEmit",
          format: "prettier --check .",
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([true, "master", true, "minimal", true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("- master");
    expect(written).toContain("run: npm run build");
    expect(written).not.toContain("cache:");
    expect(written).not.toContain("run: npm run typecheck");
    expect(written).not.toContain("run: npm run format");
  });

  it("initializes a workflow without the build step when disabled", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([true, "main", false, "minimal", true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).not.toContain("run: npm run build");
  });

  it("keeps the existing workflow during init when overwrite is declined", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
      ".github/workflows/ci.yml": "name: Existing CI\n",
    });

    prompts.inject([true, "main", true, "minimal", true, false]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toBe("name: Existing CI\n");
  });

  it("fails init for unknown projects", async () => {
    const root = await createRepo({
      "README.md": "# demo",
    });

    await expect(runInitCommand({ cwd: root })).rejects.toThrow(
      "Unable to initialize workflow for an unknown project.",
    );
  });

  it("prints a unified error and exits with code 1 when generate fails", async () => {
    const root = await createRepo({
      "README.md": "# demo",
    });

    await expect(
      execFileAsync("node", ["--import", "tsx", "src/cli.ts", "generate", "--cwd", root], {
        cwd: path.resolve("."),
      }),
    ).rejects.toMatchObject({
      code: 1,
      stdout: "",
      stderr: "Error: Unable to generate workflow for an unknown project.\n",
    });
  });

  it("prints a unified error and exits with code 1 when init fails", async () => {
    const root = await createRepo({
      "README.md": "# demo",
    });

    await expect(
      execFileAsync("node", ["--import", "tsx", "src/cli.ts", "init", "--cwd", root], {
        cwd: path.resolve("."),
      }),
    ).rejects.toMatchObject({
      code: 1,
      stdout: "",
      stderr: "Error: Unable to initialize workflow for an unknown project.\n",
    });
  });

  it("exits successfully and stays silent when init is cancelled at project confirmation", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([false]);

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    await expect(runInitCommand({ cwd: root })).resolves.toBeUndefined();
    expect(await fs.pathExists(workflowPath)).toBe(false);
  });

  it("exits successfully and does not write files when init is cancelled at final write confirmation", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([true, "main", true, "minimal", false]);

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    await expect(runInitCommand({ cwd: root })).resolves.toBeUndefined();
    expect(await fs.pathExists(workflowPath)).toBe(false);
  });

  it("detects a node fixture repository", async () => {
    const root = await createRepoFromFixture("node-pnpm");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBeUndefined();
    expect(parsed.packageManager).toBe("pnpm");
  });

  it("detects a next.js fixture repository", async () => {
    const root = await createRepoFromFixture("node-nextjs");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBe("nextjs");
    expect(parsed.packageManager).toBe("npm");
  });

  it("detects a nestjs fixture repository", async () => {
    const root = await createRepoFromFixture("node-nestjs");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBe("nestjs");
    expect(parsed.packageManager).toBe("npm");
  });

  it("detects a nuxt fixture repository", async () => {
    const root = await createRepoFromFixture("node-nuxt");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBe("nuxt");
    expect(parsed.packageManager).toBe("npm");
  });

  it("detects a yarn fixture repository", async () => {
    const root = await createRepoFromFixture("node-yarn");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.framework).toBeUndefined();
    expect(parsed.packageManager).toBe("yarn");
    expect(parsed.testCommand).toBe("yarn test");
    expect(parsed.buildCommand).toBe("yarn build");
  });

  it("detects a lint command when a node project defines a lint script", async () => {
    const root = await createRepoFromFixture("node-lint");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.lintCommand).toBe("npm run lint");
  });

  it("detects node typecheck and format commands when explicit scripts exist", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          typecheck: "tsc --noEmit",
          format: "prettier --check .",
        },
      }),
      "package-lock.json": "{}",
    });

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("node");
    expect(parsed.typecheckCommand).toBe("npm run typecheck");
    expect(parsed.formatCheckCommand).toBe("npm run format");
  });

  it("previews a python fixture repository", async () => {
    const root = await createRepoFromFixture("python-basic");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-python@v5");
    expect(stdout).toContain("run: pytest");
  });

  it("previews a fastapi fixture repository", async () => {
    const root = await createRepoFromFixture("python-fastapi");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-python@v5");
    expect(stdout).toContain("run: pip install -r requirements.txt");
    expect(stdout).toContain("run: pytest");
  });

  it("previews a django fixture repository with the conservative test fallback", async () => {
    const root = await createRepoFromFixture("python-django");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-python@v5");
    expect(stdout).toContain("run: pip install -r requirements.txt");
    expect(stdout).toContain("run: python manage.py test");
    expect(stdout).not.toContain("run: pytest");
  });

  it("previews a flask fixture repository on the generic python path", async () => {
    const root = await createRepoFromFixture("python-flask");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-python@v5");
    expect(stdout).toContain("run: pip install -r requirements.txt");
    expect(stdout).toContain("run: pytest");
  });

  it("previews a poetry fixture repository", async () => {
    const root = await createRepoFromFixture("python-poetry");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "preview", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    expect(stdout).toContain("actions/setup-python@v5");
    expect(stdout).toContain("run: poetry install --no-interaction");
    expect(stdout).toContain("run: poetry run pytest");
  });

  it("detects a python lint command when a fixture declares ruff", async () => {
    const root = await createRepoFromFixture("python-ruff");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("python");
    expect(parsed.packageManager).toBe("pip");
    expect(parsed.lintCommand).toBe("ruff check .");
  });

  it("detects a go lint command when a fixture declares golangci-lint", async () => {
    const root = await createRepoFromFixture("go-golangci");

    const { stdout } = await execFileAsync(
      "node",
      ["--import", "tsx", "src/cli.ts", "detect", "--cwd", root],
      {
        cwd: path.resolve("."),
      },
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.language).toBe("go");
    expect(parsed.lintCommand).toBe("golangci-lint run");
  });

  it("generates a workflow from a go fixture repository", async () => {
    const root = await createRepoFromFixture("go-basic");

    await runGenerateCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-go@v5");
    expect(written).toContain("run: go build ./...");
  });

  it("initializes a workflow from a vite fixture repository", async () => {
    const root = await createRepoFromFixture("node-vite");

    prompts.inject([true, "main", true, "enhanced", true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-node@v6");
    expect(written).toContain("cache: pnpm");
    expect(written).toContain("run: pnpm build");
  });

  it("initializes a workflow with optional node cache and lint step", async () => {
    const root = await createRepoFromFixture("node-lint");

    prompts.inject([true, "main", true, "enhanced", true, true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("cache: npm");
    expect(written).toContain("run: npm run lint");
    expect(written.indexOf("run: npm ci")).toBeLessThan(written.indexOf("run: npm run lint"));
    expect(written.indexOf("run: npm run lint")).toBeLessThan(written.indexOf("run: npm test"));
  });

  it("initializes a node workflow with detected typecheck and format checks in enhanced mode", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          typecheck: "tsc --noEmit",
          format: "prettier --check .",
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([true, "main", true, "enhanced", true, true, true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("cache: npm");
    expect(written).toContain("run: npm run typecheck");
    expect(written).toContain("run: npm run format");
    expect(written.indexOf("run: npm ci")).toBeLessThan(written.indexOf("run: npm run typecheck"));
    expect(written.indexOf("run: npm run typecheck")).toBeLessThan(
      written.indexOf("run: npm run format"),
    );
    expect(written.indexOf("run: npm run format")).toBeLessThan(written.indexOf("run: npm test"));
  });

  it("initializes a python workflow with cache when pip is used", async () => {
    const root = await createRepoFromFixture("python-basic");

    prompts.inject([true, "main", "enhanced", true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-python@v5");
    expect(written).toContain("cache: pip");
  });

  it("initializes a go workflow with module cache", async () => {
    const root = await createRepoFromFixture("go-basic");

    prompts.inject([true, "main", true, "enhanced", true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-go@v5");
    expect(written).toContain("cache: true");
  });

  it("does not enable cache or lint when node init keeps the minimal template", async () => {
    const root = await createRepoFromFixture("node-lint");

    prompts.inject([true, "main", true, "minimal", true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).not.toContain("cache:");
    expect(written).not.toContain("run: npm run lint");
    expect(written).not.toContain("run: npm run typecheck");
    expect(written).not.toContain("run: npm run format");
    expect(written).toContain("run: npm test");
  });

  it("initializes a poetry workflow with cache when enhanced mode is selected", async () => {
    const root = await createRepoFromFixture("python-poetry");

    prompts.inject([true, "main", "enhanced", true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("run: poetry install --no-interaction");
    expect(written).toContain("cache: poetry");
  });

  it("initializes a poetry workflow with cache and python lint when both are available", async () => {
    const root = await createRepoFromFixture("python-poetry-ruff");

    prompts.inject([true, "main", "enhanced", true, true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("cache: poetry");
    expect(written).toContain("run: poetry run ruff check .");
    expect(written.indexOf("run: poetry install --no-interaction")).toBeLessThan(
      written.indexOf("run: poetry run ruff check ."),
    );
    expect(written.indexOf("run: poetry run ruff check .")).toBeLessThan(
      written.indexOf("run: poetry run pytest"),
    );
  });

  it("initializes a go workflow with optional lint when golangci-lint is detected", async () => {
    const root = await createRepoFromFixture("go-golangci");

    prompts.inject([true, "main", true, "enhanced", true, true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("cache: true");
    expect(written).toContain("run: golangci-lint run");
    expect(written.indexOf("run: go mod download")).toBeLessThan(
      written.indexOf("run: golangci-lint run"),
    );
    expect(written.indexOf("run: golangci-lint run")).toBeLessThan(
      written.indexOf("run: go test ./..."),
    );
  });

  it("keeps the existing workflow for a fixture repository when overwrite is declined", async () => {
    const root = await createRepoFromFixture("node-existing-workflow");

    prompts.inject([false]);

    await runGenerateCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("name: Existing CI");
    expect(written).toContain('run: echo "existing"');
  });
});
