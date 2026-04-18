import { generateWorkflowFile } from "../core/engine.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";

export async function runGenerateCommand(options: { cwd?: string }): Promise<void> {
  const cwd = await resolveCwd(options.cwd);
  const result = await generateWorkflowFile(cwd);
  writeLine(result.path);
}
