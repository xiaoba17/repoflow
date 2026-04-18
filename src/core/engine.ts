import path from "node:path";

import { detectProject } from "../detectors/index.js";
import { renderGitHubActionsWorkflow } from "../renderers/github-actions-renderer.js";
import { applyRules } from "../rules/index.js";
import { fs } from "../utils/fs.js";
import { confirm } from "../utils/prompts.js";
import type { ProjectInfo } from "./types.js";

export async function resolveProjectInfo(rootPath: string): Promise<ProjectInfo> {
  const detected = await detectProject(rootPath);
  return applyRules(detected);
}

export async function generateWorkflow(rootPath: string): Promise<string> {
  const projectInfo = await resolveProjectInfo(rootPath);

  if (projectInfo.language === "unknown") {
    throw new Error("Unable to generate workflow for an unknown project.");
  }

  return renderGitHubActionsWorkflow(projectInfo);
}

export async function previewWorkflow(rootPath: string): Promise<string> {
  const projectInfo = await resolveProjectInfo(rootPath);
  return renderGitHubActionsWorkflow(projectInfo);
}

export async function generateWorkflowFile(rootPath: string): Promise<string> {
  const workflow = await generateWorkflow(rootPath);
  const workflowPath = path.join(rootPath, ".github", "workflows", "ci.yml");
  const exists = await fs.pathExists(workflowPath);

  if (exists) {
    const shouldOverwrite = await confirm(
      "A CI workflow already exists at .github/workflows/ci.yml. Overwrite it?",
    );

    if (!shouldOverwrite) {
      return workflowPath;
    }
  }

  await fs.ensureDir(path.dirname(workflowPath));
  await fs.writeFile(workflowPath, workflow);

  return workflowPath;
}
