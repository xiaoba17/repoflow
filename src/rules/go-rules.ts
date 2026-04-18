import type { ProjectInfo } from "../core/types.js";

export function applyGoRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language !== "go") {
    return projectInfo;
  }

  return {
    ...projectInfo,
    packageManager: "go",
    runtimeVersion: projectInfo.runtimeVersion ?? "1.22",
    installCommand: projectInfo.installCommand ?? "go mod download",
    testCommand: projectInfo.testCommand ?? "go test ./...",
    buildCommand: projectInfo.buildCommand ?? "go build ./...",
  };
}
