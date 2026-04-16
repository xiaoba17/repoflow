#!/usr/bin/env node

import { Command } from "commander";

import { runDetectCommand } from "./commands/detect.js";
import { runPreviewCommand } from "./commands/preview.js";

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

await program.parseAsync(process.argv);
