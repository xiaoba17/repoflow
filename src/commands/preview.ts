import { previewWorkflow } from "../core/engine.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";

export async function runPreviewCommand(options: { cwd?: string }): Promise<void> {
  const cwd = await resolveCwd(options.cwd);
  const workflow = await previewWorkflow(cwd);
  writeLine(workflow);
}
