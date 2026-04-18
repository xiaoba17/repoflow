import type { ProjectInfo, RepoScanResult } from "../core/types.js";

export function detectPythonProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasRequirementsTxt && !scanResult.hasPyprojectToml) {
    return null;
  }

  return {
    language: "python",
    packageManager: scanResult.hasPoetryLock ? "poetry" : "pip",
    ciProvider: "github-actions",
    confidence: scanResult.hasPoetryLock ? 0.9 : 0.85,
  };
}
