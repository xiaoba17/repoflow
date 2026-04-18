import type { ProjectInfo } from "../core/types.js";

import { applyGoRules } from "./go-rules.js";
import { applyNodeRules } from "./node-rules.js";
import { applyPythonRules } from "./python-rules.js";

export function applyRules(projectInfo: ProjectInfo): ProjectInfo {
  if (projectInfo.language === "node") {
    return applyNodeRules(projectInfo);
  }

  if (projectInfo.language === "python") {
    return applyPythonRules(projectInfo);
  }

  if (projectInfo.language === "go") {
    return applyGoRules(projectInfo);
  }

  return projectInfo;
}
