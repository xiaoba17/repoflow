import type { ProjectInfo } from "../core/types.js";

function frameworkBuildCommand(projectInfo: ProjectInfo): string | undefined {
  if (projectInfo.language !== "node" || !projectInfo.framework) {
    return undefined;
  }

  const execPrefix =
    projectInfo.packageManager === "pnpm"
      ? "pnpm exec"
      : projectInfo.packageManager === "yarn"
        ? "yarn exec"
        : "npx";

  switch (projectInfo.framework) {
    case "nextjs":
      return `${execPrefix} next build`;
    case "vite":
      return `${execPrefix} vite build`;
    default:
      return undefined;
  }
}

export function applyNodeRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language !== "node") {
    return projectInfo;
  }

  let installCommand = projectInfo.installCommand;
  switch (projectInfo.packageManager) {
    case "pnpm":
      installCommand = installCommand ?? "pnpm install --frozen-lockfile";
      break;
    case "yarn":
      installCommand = installCommand ?? "yarn install --frozen-lockfile";
      break;
    case "npm":
    default:
      installCommand = installCommand ?? "npm ci";
      break;
  }

  return {
    ...projectInfo,
    installCommand,
    buildCommand: projectInfo.buildCommand ?? frameworkBuildCommand(projectInfo),
  };
}
