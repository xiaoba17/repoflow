import type { ProjectInfo, RepoScanResult } from "../core/types.js";

interface NodePackageJson {
  scripts?: {
    test?: string;
    build?: string;
  };
  engines?: {
    node?: string;
  };
}

function inferPackageManager(scanResult: RepoScanResult): ProjectInfo["packageManager"] | undefined {
  if (scanResult.hasPnpmLock) {
    return "pnpm";
  }

  if (scanResult.hasPackageLock) {
    return "npm";
  }

  if (scanResult.hasYarnLock) {
    return "yarn";
  }

  return "npm";
}

function commandPrefix(packageManager: ProjectInfo["packageManager"]): string {
  switch (packageManager) {
    case "pnpm":
      return "pnpm";
    case "yarn":
      return "yarn";
    case "npm":
    default:
      return "npm";
  }
}

function scriptCommand(
  packageManager: ProjectInfo["packageManager"],
  scriptName: "test" | "build",
): string {
  if (packageManager === "npm" && scriptName === "build") {
    return "npm run build";
  }

  return `${commandPrefix(packageManager)} ${scriptName}`;
}

function normalizeRuntimeVersion(version?: string): string | undefined {
  if (!version) {
    return undefined;
  }

  const match = version.match(/\d+(?:\.\d+)?/);
  return match?.[0];
}

export function detectNodeProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasPackageJson || !scanResult.rawFiles.packageJson) {
    return null;
  }

  const packageJson = JSON.parse(scanResult.rawFiles.packageJson) as NodePackageJson;
  const packageManager = inferPackageManager(scanResult);

  return {
    language: "node",
    packageManager,
    runtimeVersion: normalizeRuntimeVersion(packageJson.engines?.node) ?? "20",
    testCommand: packageJson.scripts?.test ? scriptCommand(packageManager, "test") : undefined,
    buildCommand: packageJson.scripts?.build ? scriptCommand(packageManager, "build") : undefined,
    ciProvider: "github-actions",
    confidence: 0.95,
  };
}
