import type { ProjectInfo, RepoScanResult } from "../core/types.js";

interface NodePackageJson {
  scripts?: {
    test?: string;
    lint?: string;
    build?: string;
  };
  engines?: {
    node?: string;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
  scriptName: "test" | "lint" | "build",
): string {
  if (packageManager === "npm") {
    if (scriptName === "test") {
      return "npm test";
    }

    return `npm run ${scriptName}`;
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

function detectFramework(packageJson: NodePackageJson): ProjectInfo["framework"] | undefined {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (dependencies.next) {
    return "nextjs";
  }

  if (dependencies.vite) {
    return "vite";
  }

  return undefined;
}

export function detectNodeProject(scanResult: RepoScanResult): ProjectInfo | null {
  if (!scanResult.hasPackageJson || !scanResult.rawFiles.packageJson) {
    return null;
  }

  const packageJson = JSON.parse(scanResult.rawFiles.packageJson) as NodePackageJson;
  const packageManager = inferPackageManager(scanResult);
  const framework = detectFramework(packageJson);

  return {
    language: "node",
    framework,
    packageManager,
    runtimeVersion: normalizeRuntimeVersion(packageJson.engines?.node) ?? "20",
    testCommand: packageJson.scripts?.test ? scriptCommand(packageManager, "test") : undefined,
    lintCommand: packageJson.scripts?.lint ? scriptCommand(packageManager, "lint") : undefined,
    buildCommand: packageJson.scripts?.build ? scriptCommand(packageManager, "build") : undefined,
    ciProvider: "github-actions",
    confidence: 0.95,
  };
}
