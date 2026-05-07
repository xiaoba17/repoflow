import type { ProjectInfo, RepoScanResult } from "../core/types.js";

interface NodePackageJson {
  scripts?: {
    test?: string;
    lint?: string;
    typecheck?: string;
    format?: string;
    coverage?: string;
    build?: string;
  };
  engines?: {
    node?: string;
  };
  config?: {
    repoflow?: {
      coverageArtifactPath?: string;
    };
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
  scriptName: "test" | "lint" | "typecheck" | "format" | "coverage" | "build",
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

  if (dependencies["@nestjs/core"]) {
    return "nestjs";
  }

  if (dependencies.nuxt) {
    return "nuxt";
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
  const coverageCommand = packageJson.scripts?.coverage
    ? scriptCommand(packageManager, "coverage")
    : undefined;

  return {
    language: "node",
    framework,
    packageManager,
    runtimeVersion: normalizeRuntimeVersion(packageJson.engines?.node) ?? "20",
    testCommand: packageJson.scripts?.test ? scriptCommand(packageManager, "test") : undefined,
    lintCommand: packageJson.scripts?.lint ? scriptCommand(packageManager, "lint") : undefined,
    typecheckCommand: packageJson.scripts?.typecheck
      ? scriptCommand(packageManager, "typecheck")
      : undefined,
    formatCheckCommand: packageJson.scripts?.format
      ? scriptCommand(packageManager, "format")
      : undefined,
    coverageCommand,
    coverageArtifactPath: coverageCommand
      ? packageJson.config?.repoflow?.coverageArtifactPath
      : undefined,
    buildCommand: packageJson.scripts?.build ? scriptCommand(packageManager, "build") : undefined,
    ciProvider: "github-actions",
    confidence: 0.95,
  };
}
