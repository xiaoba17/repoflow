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
    expect(parsed.packageManager).toBe("npm");
    expect(parsed.testCommand).toBe("npm test");
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
    expect(stdout).toContain("actions/setup-node@v4");
    expect(stdout).toContain("run: yarn install --frozen-lockfile");
    expect(stdout).toContain("run: yarn test");
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
          build: "tsc -p tsconfig.json",
        },
      }),
      "package-lock.json": "{}",
    });

    prompts.inject([true, "master", true, true]);

    await runInitCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("- master");
    expect(written).toContain("run: npm run build");
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

    prompts.inject([true, "main", false, true]);

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

    prompts.inject([true, "main", true, true, false]);

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

    prompts.inject([true, "main", true, false]);

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
    expect(parsed.packageManager).toBe("pnpm");
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

  it("generates a workflow from a go fixture repository", async () => {
    const root = await createRepoFromFixture("go-basic");

    await runGenerateCommand({ cwd: root });

    const workflowPath = path.join(root, ".github/workflows/ci.yml");
    const written = await fs.readFile(workflowPath, "utf8");
    expect(written).toContain("actions/setup-go@v5");
    expect(written).toContain("run: go build ./...");
  });
});
