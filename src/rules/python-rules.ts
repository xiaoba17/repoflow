import type { ProjectInfo } from "../core/types.js";

export function applyPythonRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language !== "python") {
    return projectInfo;
  }

  const defaultTestCommand =
    projectInfo.framework === "django"
      ? projectInfo.packageManager === "poetry"
        ? "poetry run python manage.py test"
        : "python manage.py test"
      : undefined;

  if (projectInfo.packageManager === "poetry") {
    return {
      ...projectInfo,
      runtimeVersion: projectInfo.runtimeVersion ?? "3.11",
      installCommand: projectInfo.installCommand ?? "poetry install --no-interaction",
      testCommand: projectInfo.testCommand ?? defaultTestCommand ?? "poetry run pytest",
    };
  }

  return {
    ...projectInfo,
    packageManager: projectInfo.packageManager ?? "pip",
    runtimeVersion: projectInfo.runtimeVersion ?? "3.11",
    installCommand: projectInfo.installCommand ?? "pip install -r requirements.txt",
    testCommand: projectInfo.testCommand ?? defaultTestCommand ?? "pytest",
  };
}
