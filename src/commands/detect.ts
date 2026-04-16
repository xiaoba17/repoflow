import { resolveProjectInfo } from "../core/engine.js";
import { resolveCwd } from "../utils/fs.js";
import { writeLine } from "../utils/logger.js";

export async function runDetectCommand(options: { cwd?: string }): Promise<void> {
  const cwd = await resolveCwd(options.cwd);
  const projectInfo = await resolveProjectInfo(cwd);
  writeLine(JSON.stringify(projectInfo, null, 2));
}
