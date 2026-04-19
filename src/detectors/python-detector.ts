import type { ProjectInfo, RepoScanResult } from "../core/types.js";

function containsDependency(fileContent: string | null, dependencyName: string): boolean {
  if (!fileContent) {
    return false;
  }

  const pattern = new RegExp(`(^|[\\s"'=])${dependencyName}([\\s"'=><\\[]|$)`, "im");
  return pattern.test(fileContent);
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
    ciProvider: "github-actions",
    confidence: scanResult.hasPoetryLock ? 0.9 : 0.85,
  };
}
