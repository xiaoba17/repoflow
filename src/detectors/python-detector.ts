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

function detectTestCommand(scanResult: RepoScanResult): ProjectInfo["testCommand"] | undefined {
  const hasPytest =
    containsDependency(scanResult.rawFiles.requirementsTxt, "pytest") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "pytest") ||
    containsDependency(scanResult.rawFiles.poetryLock, "pytest");

  if (!hasPytest) {
    return undefined;
  }

  return scanResult.hasPoetryLock ? "poetry run pytest" : "pytest";
}

export function detectPythonProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasRequirementsTxt && !scanResult.hasPyprojectToml) {
    return null;
  }

  let framework: ProjectInfo["framework"];
  if (
    containsDependency(scanResult.rawFiles.requirementsTxt, "fastapi") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "fastapi")
  ) {
    framework = "fastapi";
  } else if (
    containsDependency(scanResult.rawFiles.requirementsTxt, "django") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "django") ||
    containsDependency(scanResult.rawFiles.poetryLock, "django")
  ) {
    framework = "django";
  } else if (
    containsDependency(scanResult.rawFiles.requirementsTxt, "flask") ||
    containsDependency(scanResult.rawFiles.pyprojectToml, "flask") ||
    containsDependency(scanResult.rawFiles.poetryLock, "flask")
  ) {
    framework = "flask";
  }

  return {
    language: "python",
    framework,
    packageManager: scanResult.hasPoetryLock ? "poetry" : "pip",
    lintCommand: detectLintCommand(scanResult),
    testCommand: detectTestCommand(scanResult),
    ciProvider: "github-actions",
    confidence: scanResult.hasPoetryLock ? 0.9 : 0.85,
  };
}
