import { previewWorkflow, resolveProjectInfo, writeWorkflowFile } from "../core/engine.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";
import { confirm, select } from "../utils/prompts.js";

export async function runInitCommand(options: { cwd?: string }): Promise<void> {
  const cwd = await resolveCwd(options.cwd);
  const projectInfo = await resolveProjectInfo(cwd);

  if (projectInfo.language === "unknown") {
    throw new Error("Unable to initialize workflow for an unknown project.");
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

  const workflow = await previewWorkflow(cwd, {
    defaultBranch,
    includeBuildStep,
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
