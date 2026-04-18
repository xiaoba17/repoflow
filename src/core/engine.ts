import path from "node:path";

import { detectProject } from "../detectors/index.js";
import { renderGitHubActionsWorkflow } from "../renderers/github-actions-renderer.js";
import { applyRules } from "../rules/index.js";
import { fs } from "../utils/fs.js";
import { confirm } from "../utils/prompts.js";
import type { ProjectInfo, WorkflowOptions } from "./types.js";

const DEFAULT_WORKFLOW_OPTIONS: WorkflowOptions = {
  defaultBranch: "main",
  includeBuildStep: true,
};

export type WorkflowWriteMode = "ask" | "overwrite" | "skip";

export interface WorkflowWriteResult {
  path: string;
  written: boolean;
}

export async function resolveProjectInfo(rootPath: string): Promise<ProjectInfo> {
  const detected = await detectProject(rootPath);
  return applyRules(detected);
}

function resolveWorkflowOptions(options?: Partial<WorkflowOptions>): WorkflowOptions {
  return {
    defaultBranch: options?.defaultBranch ?? DEFAULT_WORKFLOW_OPTIONS.defaultBranch,
    includeBuildStep: options?.includeBuildStep ?? DEFAULT_WORKFLOW_OPTIONS.includeBuildStep,
  };
}

export function renderProjectWorkflow(
  projectInfo: ProjectInfo,
  options?: Partial<WorkflowOptions>,
): string {
  return renderGitHubActionsWorkflow(projectInfo, resolveWorkflowOptions(options));
}

export async function generateWorkflow(
  rootPath: string,
  options?: Partial<WorkflowOptions>,
): Promise<string> {
  const projectInfo = await resolveProjectInfo(rootPath);

  if (projectInfo.language === "unknown") {
    throw new Error("Unable to generate workflow for an unknown project.");
  }

  return renderProjectWorkflow(projectInfo, options);
}

export async function previewWorkflow(
  rootPath: string,
  options?: Partial<WorkflowOptions>,
): Promise<string> {
  const projectInfo = await resolveProjectInfo(rootPath);
  return renderProjectWorkflow(projectInfo, options);
}

export async function writeWorkflowFile(
  rootPath: string,
  workflow: string,
  mode: WorkflowWriteMode = "ask",
): Promise<WorkflowWriteResult> {
  const workflowPath = path.join(rootPath, ".github", "workflows", "ci.yml");
  const exists = await fs.pathExists(workflowPath);

  if (exists) {
    if (mode === "skip") {
      return { path: workflowPath, written: false };
    }

    if (mode === "ask") {
      const shouldOverwrite = await confirm(
        "A CI workflow already exists at .github/workflows/ci.yml. Overwrite it?",
      );

      if (!shouldOverwrite) {
        return { path: workflowPath, written: false };
      }
    }
  }

  await fs.ensureDir(path.dirname(workflowPath));
  await fs.writeFile(workflowPath, workflow);

  return { path: workflowPath, written: true };
}

export async function generateWorkflowFile(
  rootPath: string,
  options?: Partial<WorkflowOptions>,
  mode: WorkflowWriteMode = "ask",
): Promise<WorkflowWriteResult> {
  const workflow = await generateWorkflow(rootPath, options);
  return writeWorkflowFile(rootPath, workflow, mode);
}
