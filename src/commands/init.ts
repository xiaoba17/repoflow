import { previewWorkflow, resolveProjectInfo, writeWorkflowFile } from "../core/engine.js";
import { RepoFlowError } from "../utils/errors.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";
import { confirm, select } from "../utils/prompts.js";
import type { ProjectInfo, WorkflowOptions } from "../core/types.js";

function supportsCacheOption(projectInfo: ProjectInfo): boolean {
  if (projectInfo.language === "node" || projectInfo.language === "go") {
    return true;
  }

  return (
    projectInfo.language === "python" &&
    (projectInfo.packageManager === "pip" || projectInfo.packageManager === "poetry")
  );
}

function supportsLintOption(projectInfo: ProjectInfo): boolean {
  return Boolean(projectInfo.lintCommand);
}

function supportsTypecheckOption(projectInfo: ProjectInfo): boolean {
  return Boolean(projectInfo.typecheckCommand);
}

function supportsFormatOption(projectInfo: ProjectInfo): boolean {
  return Boolean(projectInfo.formatCheckCommand);
}

function supportsEnhancedTemplate(projectInfo: ProjectInfo): boolean {
  return (
    supportsCacheOption(projectInfo) ||
    supportsLintOption(projectInfo) ||
    supportsTypecheckOption(projectInfo) ||
    supportsFormatOption(projectInfo)
  );
}

export async function runInitCommand(options: { cwd?: string }): Promise<void> {
  const cwd = await resolveCwd(options.cwd);
  const projectInfo = await resolveProjectInfo(cwd);

  if (projectInfo.language === "unknown") {
    throw new RepoFlowError("Unable to initialize workflow for an unknown project.");
  }

  const confirmedProject = await confirm(
    `Detected a ${projectInfo.language} project. Is that correct?`,
  );
  if (!confirmedProject) {
    return;
  }

  const defaultBranch =
    (await select(
      "Which branch should trigger the workflow by default?",
      [
        { title: "main", value: "main" },
        { title: "master", value: "master" },
      ],
      0,
    )) ?? "main";

  const includeBuildStep = projectInfo.buildCommand
    ? await confirm("Keep the detected build step in the workflow?")
    : false;
  const profile: WorkflowOptions["profile"] = supportsEnhancedTemplate(projectInfo)
    ? ((await select(
        "Which workflow template should init use?",
        [
          {
            title: "Minimal: keep the default install / test / build flow only",
            value: "minimal",
          },
          {
            title: "Enhanced: review optional cache and lint additions",
            value: "enhanced",
          },
        ],
        0,
      )) ?? "minimal")
    : "minimal";
  const cache =
    profile === "enhanced" && supportsCacheOption(projectInfo)
      ? await confirm("Enable dependency cache in the workflow?")
      : false;
  const lint =
    profile === "enhanced" && supportsLintOption(projectInfo)
      ? await confirm("Add the detected lint step to the workflow?")
      : false;
  const typecheck =
    profile === "enhanced" && supportsTypecheckOption(projectInfo)
      ? await confirm("Add the detected typecheck step to the workflow?")
      : false;
  const format =
    profile === "enhanced" && supportsFormatOption(projectInfo)
      ? await confirm("Add the detected format check step to the workflow?")
      : false;

  const workflow = await previewWorkflow(cwd, {
    defaultBranch,
    profile,
    includeBuildStep,
    capabilities: {
      cache,
      lint,
      typecheck,
      format,
      coverage: false,
      coverageArtifact: false,
    },
  });

  writeLine(workflow);

  const shouldWrite = await confirm("Write this workflow to .github/workflows/ci.yml?");
  if (!shouldWrite) {
    return;
  }

  const result = await writeWorkflowFile(cwd, workflow, "ask");
  if (!result.written) {
    return;
  }

  writeLine(result.path);
}
