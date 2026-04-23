import { previewWorkflow, resolveProjectInfo, writeWorkflowFile } from "../core/engine.js";
import { RepoFlowError } from "../utils/errors.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";
import { confirm, select } from "../utils/prompts.js";
import type { ProjectInfo } from "../core/types.js";

function supportsCacheOption(projectInfo: ProjectInfo): boolean {
  if (projectInfo.language === "node" || projectInfo.language === "go") {
    return true;
  }

  return projectInfo.language === "python" && projectInfo.packageManager === "pip";
}

function supportsLintOption(projectInfo: ProjectInfo): boolean {
  return projectInfo.language === "node" && Boolean(projectInfo.lintCommand);
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
  const enableCache = supportsCacheOption(projectInfo)
    ? await confirm("Enable dependency cache in the workflow?")
    : false;
  const includeLintStep = supportsLintOption(projectInfo)
    ? await confirm("Add the detected lint step to the workflow?")
    : false;

  const workflow = await previewWorkflow(cwd, {
    defaultBranch,
    includeBuildStep,
    enableCache,
    includeLintStep,
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
