import YAML from "yaml";

import type { ProjectInfo, WorkflowConfig, WorkflowOptions, WorkflowStep } from "../core/types.js";

function capabilityEnabled(
  options: WorkflowOptions,
  capability: keyof WorkflowOptions["capabilities"],
): boolean {
  return options.profile === "enhanced" && options.capabilities[capability];
}

function artifactUploadEnabled(options: WorkflowOptions): boolean {
  return (
    options.profile === "enhanced" &&
    options.capabilities.coverage &&
    options.capabilities.coverageArtifact
  );
}

function createSetupStep(projectInfo: ProjectInfo, options: WorkflowOptions): WorkflowStep | null {
  switch (projectInfo.language) {
    case "node": {
      const runtimeVersion = projectInfo.runtimeVersion ?? "20";
      const normalizedVersion = /^\d+$/.test(runtimeVersion)
        ? Number(runtimeVersion)
        : runtimeVersion;
      const withConfig: WorkflowStep["with"] = {
        "node-version": normalizedVersion,
      };

      if (capabilityEnabled(options, "cache") && projectInfo.packageManager) {
        withConfig.cache = projectInfo.packageManager;
      }

      return {
        uses: "actions/setup-node@v6",
        with: withConfig,
      };
    }
    case "python": {
      const withConfig: WorkflowStep["with"] = {
        "python-version": projectInfo.runtimeVersion ?? "3.11",
      };

      if (capabilityEnabled(options, "cache")) {
        if (projectInfo.packageManager === "pip") {
          withConfig.cache = "pip";
        }

        if (projectInfo.packageManager === "poetry") {
          withConfig.cache = "poetry";
        }
      }

      return {
        uses: "actions/setup-python@v5",
        with: withConfig,
      };
    }
    case "go": {
      const withConfig: WorkflowStep["with"] = {
        "go-version": projectInfo.runtimeVersion ?? "1.22",
      };

      if (capabilityEnabled(options, "cache")) {
        withConfig.cache = true;
      }

      return {
        uses: "actions/setup-go@v5",
        with: withConfig,
      };
    }
    default:
      return null;
  }
}

export function renderGitHubActionsWorkflow(
  projectInfo: ProjectInfo,
  options: WorkflowOptions = {
    defaultBranch: "main",
    profile: "minimal",
    includeBuildStep: true,
    capabilities: {
      cache: false,
      lint: false,
      typecheck: false,
      format: false,
      coverage: false,
      coverageArtifact: false,
    },
  },
): string {
  const steps: WorkflowStep[] = [{ uses: "actions/checkout@v6" }];
  const setupStep = createSetupStep(projectInfo, options);

  if (setupStep) {
    steps.push(setupStep);
  }

  if (projectInfo.installCommand) {
    steps.push({ run: projectInfo.installCommand });
  }

  if (capabilityEnabled(options, "lint") && projectInfo.lintCommand) {
    steps.push({ run: projectInfo.lintCommand });
  }

  if (capabilityEnabled(options, "typecheck") && projectInfo.typecheckCommand) {
    steps.push({ run: projectInfo.typecheckCommand });
  }

  if (capabilityEnabled(options, "format") && projectInfo.formatCheckCommand) {
    steps.push({ run: projectInfo.formatCheckCommand });
  }

  if (capabilityEnabled(options, "coverage") && projectInfo.coverageCommand) {
    steps.push({ run: projectInfo.coverageCommand });
  }

  if (projectInfo.testCommand) {
    steps.push({ run: projectInfo.testCommand });
  }

  if (options.includeBuildStep && projectInfo.buildCommand) {
    steps.push({ run: projectInfo.buildCommand });
  }

  if (artifactUploadEnabled(options) && projectInfo.coverageArtifactPath) {
    steps.push({
      uses: "actions/upload-artifact@v4",
      with: {
        name: "coverage-report",
        path: projectInfo.coverageArtifactPath,
      },
    });
  }

  const workflow: WorkflowConfig = {
    name: "CI",
    on: {
      push: { branches: [options.defaultBranch] },
      pull_request: {},
    },
    jobs: {
      ci: {
        "runs-on": "ubuntu-latest",
        steps,
      },
    },
  };

  return YAML.stringify(workflow);
}
