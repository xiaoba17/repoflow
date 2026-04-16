import path from "node:path";

import fs from "fs-extra";

export async function resolveCwd(inputCwd?: string): Promise<string> {
  return path.resolve(inputCwd ?? process.cwd());
}

export { fs };
