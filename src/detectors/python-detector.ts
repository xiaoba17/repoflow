import type { ProjectInfo, RepoScanResult } from "../core/types.js";

function containsDependency(fileContent: string | null, dependencyName: string): boolean {
  if (!fileContent) {
    return false;
  }

  const pattern = new RegExp(`(^|[\\s"'=])${dependencyName}([\\s"'=><\\[]|$)`, "im");
  return pattern.test(fileContent);
}

function detectLintCommand(scanResult: RepoScanResult): ProjectInfo["lintCommand"] | undefined {
  const hasRuff =
    containsDependency(scanResult.rawFiles.requirementsTxt, "ruff") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "ruff") ||
    containsDependency(scanResult.rawFiles.poetryLock, "ruff");

  if (!hasRuff) {
    return undefined;
  }

  return scanResult.hasPoetryLock ? "poetry run ruff check ." : "ruff check .";
}

export function detectPythonProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasRequirementsTxt && !scanResult.hasPyprojectToml) {
    return null;
  }

  const framework =
    containsDependency(scanResult.rawFiles.requirementsTxt, "fastapi") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "fastapi")
      ? "fastapi"
      : undefined;

  return {
    language: "python",
    framework,
    packageManager: scanResult.hasPoetryLock ? "poetry" : "pip",
    lintCommand: detectLintCommand(scanResult),
    ciProvider: "github-actions",
    confidence: scanResult.hasPoetryLock ? 0.9 : 0.85,
  };
}
