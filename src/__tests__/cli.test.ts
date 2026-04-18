import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { runGenerateCommand } from "../commands/generate.js";
import { prompts } from "../utils/prompts.js";

const execFileAsync = promisify(execFile);
const tempRoots: string[] = [];

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
});
