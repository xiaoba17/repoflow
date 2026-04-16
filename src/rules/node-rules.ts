import type { ProjectInfo } from "../core/types.js";

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
  };
}
