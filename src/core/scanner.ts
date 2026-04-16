import path from "node:path";

import fs from "fs-extra";

import type { RepoScanResult } from "./types.js";

async function readIfExists(rootPath: string, fileName: string): Promise<string | null> {
  const filePath = path.join(rootPath, fileName);
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    return null;
  }

  return fs.readFile(filePath, "utf8");
}

export async function scanRepository(rootPath: string): Promise<RepoScanResult> {
  const entries = (await fs.readdir(rootPath)).sort((left, right) => {
    const normalizedComparison = left.toLowerCase().localeCompare(right.toLowerCase());
    if (normalizedComparison !== 0) {
      return normalizedComparison;
    }

    return left.localeCompare(right);
  });
  const [
    packageJson,
    pnpmLock,
    requirementsTxt,
    pyprojectToml,
    poetryLock,
    goMod,
  ] = await Promise.all([
    readIfExists(rootPath, "package.json"),
    readIfExists(rootPath, "pnpm-lock.yaml"),
    readIfExists(rootPath, "requirements.txt"),
    readIfExists(rootPath, "pyproject.toml"),
    readIfExists(rootPath, "poetry.lock"),
    readIfExists(rootPath, "go.mod"),
  ]);

  return {
    rootPath,
    files: entries,
    hasPackageJson: packageJson !== null,
    hasPnpmLock: pnpmLock !== null,
    hasYarnLock: await fs.pathExists(path.join(rootPath, "yarn.lock")),
    hasPackageLock: await fs.pathExists(path.join(rootPath, "package-lock.json")),
    hasRequirementsTxt: requirementsTxt !== null,
    hasPyprojectToml: pyprojectToml !== null,
    hasPoetryLock: poetryLock !== null,
    hasGoMod: goMod !== null,
    rawFiles: {
      packageJson,
      pnpmLock,
      requirementsTxt,
      pyprojectToml,
      poetryLock,
      goMod,
    },
  };
}
