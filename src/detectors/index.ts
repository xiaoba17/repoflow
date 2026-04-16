import { scanRepository } from "../core/scanner.js";
import type { ProjectInfo } from "../core/types.js";

import { detectNodeProject } from "./node-detector.js";

export async function detectProject(rootPath: string): Promise<ProjectInfo> {
  const scanResult = await scanRepository(rootPath);
  const detected = detectNodeProject(scanResult);

  if (detected) {
    return detected;
  }

  return {
    language: "unknown",
    ciProvider: "github-actions",
    confidence: 0,
  };
}
