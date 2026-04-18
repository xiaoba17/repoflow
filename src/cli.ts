#!/usr/bin/env node

import { Command } from "commander";

import { runDetectCommand } from "./commands/detect.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runInitCommand } from "./commands/init.js";
import { runPreviewCommand } from "./commands/preview.js";
import { formatErrorMessage } from "./utils/errors.js";
import { writeErrorLine } from "./utils/logger.js";

const program = new Command();

program
  .name("repoflow")
  .description("Detect repository type and generate minimal GitHub Actions CI workflows.")
  .version("0.1.0");

program
  .command("detect")
  .option("--cwd <path>", "Repository path to inspect")
  .action(runDetectCommand);

program
  .command("preview")
  .option("--cwd <path>", "Repository path to inspect")
  .action(runPreviewCommand);

program
  .command("generate")
  .option("--cwd <path>", "Repository path to inspect")
  .action(runGenerateCommand);

program
  .command("init")
  .option("--cwd <path>", "Repository path to inspect")
  .action(runInitCommand);

try {
  await program.parseAsync(process.argv);
} catch (error) {
  writeErrorLine(formatErrorMessage(error));
  process.exitCode = 1;
}
