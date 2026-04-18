import { scanRepository } from "../core/scanner.js";
import type { ProjectInfo } from "../core/types.js";

import { detectGoProject } from "./go-detector.js";
import { detectNodeProject } from "./node-detector.js";
import { detectPythonProject } from "./python-detector.js";

export async function detectProject(rootPath: string): Promise<ProjectInfo> {
  const scanResult = await scanRepository(rootPath);
  const candidates = [
    detectNodeProject(scanResult),
    detectPythonProject(scanResult),
    detectGoProject(scanResult),
  ].filter((candidate): candidate is ProjectInfo => candidate !== null);

  if (candidates.length > 0) {
    return candidates.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );
  }

  return {
    language: "unknown",
    ciProvider: "github-actions",
    confidence: 0,
  };
}
