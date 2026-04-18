export type LanguageType = "node" | "python" | "go" | "unknown";

export type PackageManagerType =
  | "npm"
  | "pnpm"
  | "yarn"
  | "pip"
  | "poetry"
  | "go";

export interface RepoRawFiles {
  packageJson: string | null;
  pnpmLock: string | null;
  requirementsTxt: string | null;
  pyprojectToml: string | null;
  poetryLock: string | null;
  goMod: string | null;
}

export interface RepoScanResult {
  rootPath: string;
  files: string[];
  hasPackageJson: boolean;
  hasPnpmLock: boolean;
  hasYarnLock: boolean;
  hasPackageLock: boolean;
  hasRequirementsTxt: boolean;
  hasPyprojectToml: boolean;
  hasPoetryLock: boolean;
  hasGoMod: boolean;
  rawFiles: RepoRawFiles;
}

export interface ProjectInfo {
  language: LanguageType;
  framework?: string;
  packageManager?: PackageManagerType;
  runtimeVersion?: string;
  installCommand?: string;
  testCommand?: string;
  buildCommand?: string;
  ciProvider: "github-actions";
  confidence: number;
}

export interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | number | boolean>;
}

export interface WorkflowJob {
  "runs-on": string;
  steps: WorkflowStep[];
}

export interface WorkflowConfig {
  name: string;
  on: {
    push: { branches: string[] };
    pull_request: Record<string, never>;
  };
  jobs: Record<string, WorkflowJob>;
}
