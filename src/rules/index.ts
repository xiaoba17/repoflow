import type { ProjectInfo } from "../core/types.js";

import { applyNodeRules } from "./node-rules.js";

export function applyRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language === "node") {
    return applyNodeRules(projectInfo);
  }

  return projectInfo;
}
