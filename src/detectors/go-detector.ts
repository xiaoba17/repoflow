import type { ProjectInfo, RepoScanResult } from "../core/types.js";

function normalizeGoVersion(goMod: string | null): string | undefined {
  if (!goMod) {
    return undefined;
  }

  const match = goMod.match(/^go\s+(\d+\.\d+)/m);
  return match?.[1];
}

export function detectGoProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasGoMod) {
    return null;
  }

  return {
    language: "go",
    packageManager: "go",
    runtimeVersion: normalizeGoVersion(scanResult.rawFiles.goMod),
    ciProvider: "github-actions",
    confidence: 0.92,
  };
}
