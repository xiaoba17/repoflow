import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { scanRepository } from "../core/scanner.js";

const tempRoots: string[] = [];

async function createRepo(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "repoflow-scanner-"));
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

describe("scanRepository", () => {
  it("detects key files and returns sorted root files", async () => {
    const root = await createRepo({
      "package.json": JSON.stringify({ name: "demo" }),
      "pnpm-lock.yaml": "lockfileVersion: '9.0'",
      "README.md": "# Demo",
      "src/index.ts": "console.log('hello');",
    });

    const result = await scanRepository(root);

    expect(result.rootPath).toBe(root);
    expect(result.files).toEqual(["package.json", "pnpm-lock.yaml", "README.md", "src"]);
    expect(result.hasPackageJson).toBe(true);
    expect(result.hasPnpmLock).toBe(true);
    expect(result.hasPackageLock).toBe(false);
    expect(result.rawFiles.packageJson).toContain('"name":"demo"');
    expect(result.rawFiles.pnpmLock).toContain("lockfileVersion");
  });

  it("returns null raw content for missing files", async () => {
    const root = await createRepo({
      "go.mod": "module example.com/test",
    });

    const result = await scanRepository(root);

    expect(result.hasGoMod).toBe(true);
    expect(result.hasPackageJson).toBe(false);
    expect(result.rawFiles.packageJson).toBeNull();
    expect(result.rawFiles.pyprojectToml).toBeNull();
  });
});
