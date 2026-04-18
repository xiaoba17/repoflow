import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { detectProject } from "../detectors/index.js";

const tempRoots: string[] = [];

async function createRepo(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "repoflow-detector-"));
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

describe("detectProject", () => {
  it("detects a pnpm node project from package metadata", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.json",
        },
        engines: {
          node: "20",
        },
      }),
      "pnpm-lock.yaml": "lockfileVersion: '9.0'",
    });

    const result = await detectProject(root);

    expect(result.language).toBe("node");
    expect(result.packageManager).toBe("pnpm");
    expect(result.runtimeVersion).toBe("20");
    expect(result.testCommand).toBe("pnpm test");
    expect(result.buildCommand).toBe("pnpm build");
    expect(result.ciProvider).toBe("github-actions");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("returns unknown when no supported project files are present", async () => {
    const root = await createRepo({
      "README.md": "# demo",
    });

    const result = await detectProject(root);

    expect(result.language).toBe("unknown");
    expect(result.ciProvider).toBe("github-actions");
    expect(result.confidence).toBe(0);
  });

  it("detects a python project from requirements.txt", async () => {
    const root = await createRepo({
      "requirements.txt": "pytest==8.3.0\n",
    });

    const result = await detectProject(root);

    expect(result.language).toBe("python");
    expect(result.packageManager).toBe("pip");
    expect(result.runtimeVersion).toBeUndefined();
    expect(result.ciProvider).toBe("github-actions");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("detects a poetry project from pyproject.toml and poetry.lock", async () => {
    const root = await createRepo({
      "pyproject.toml": "[tool.poetry]\nname = 'demo'\n",
      "poetry.lock": "[[package]]\nname = 'pytest'\n",
    });

    const result = await detectProject(root);

    expect(result.language).toBe("python");
    expect(result.packageManager).toBe("poetry");
    expect(result.ciProvider).toBe("github-actions");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects a go project from go.mod", async () => {
    const root = await createRepo({
      "go.mod": "module example.com/demo\n\ngo 1.22.3\n",
    });

    const result = await detectProject(root);

    expect(result.language).toBe("go");
    expect(result.packageManager).toBe("go");
    expect(result.runtimeVersion).toBe("1.22");
    expect(result.ciProvider).toBe("github-actions");
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
