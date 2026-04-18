import type { ProjectInfo } from "../core/types.js";

export function applyPythonRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language !== "python") {
    return projectInfo;
  }

  if (projectInfo.packageManager === "poetry") {
    return {
      ...projectInfo,
      runtimeVersion: projectInfo.runtimeVersion ?? "3.11",
      installCommand: projectInfo.installCommand ?? "poetry install --no-interaction",
      testCommand: projectInfo.testCommand ?? "poetry run pytest",
    };
  }

  return {
    ...projectInfo,
    packageManager: projectInfo.packageManager ?? "pip",
    runtimeVersion: projectInfo.runtimeVersion ?? "3.11",
    installCommand: projectInfo.installCommand ?? "pip install -r requirements.txt",
    testCommand: projectInfo.testCommand ?? "pytest",
  };
}
