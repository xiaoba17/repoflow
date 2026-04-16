import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

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
});
