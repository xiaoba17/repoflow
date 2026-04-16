import { detectProject } from "../detectors/index.js";
import { renderGitHubActionsWorkflow } from "../renderers/github-actions-renderer.js";
import { applyRules } from "../rules/index.js";
import type { ProjectInfo } from "./types.js";

export async function resolveProjectInfo(rootPath: string): Promise<ProjectInfo> {
  const detected = await detectProject(rootPath);
  return applyRules(detected);
}

export async function previewWorkflow(rootPath: string): Promise<string> {
  const projectInfo = await resolveProjectInfo(rootPath);
  return renderGitHubActionsWorkflow(projectInfo);
}
