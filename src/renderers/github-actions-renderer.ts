import YAML from "yaml";

import type { ProjectInfo, WorkflowConfig, WorkflowStep } from "../core/types.js";

function createSetupStep(projectInfo: ProjectInfo): WorkflowStep | null {
  switch (projectInfo.language) {
    case "node": {
      const runtimeVersion = projectInfo.runtimeVersion ?? "20";
      const normalizedVersion = /^\d+$/.test(runtimeVersion)
        ? Number(runtimeVersion)
        : runtimeVersion;

      return {
        uses: "actions/setup-node@v4",
        with: {
          "node-version": normalizedVersion,
        },
      };
    }
    case "python":
      return {
        uses: "actions/setup-python@v5",
        with: {
          "python-version": projectInfo.runtimeVersion ?? "3.11",
        },
      };
    case "go":
      return {
        uses: "actions/setup-go@v5",
        with: {
          "go-version": projectInfo.runtimeVersion ?? "1.22",
        },
      };
    default:
      return null;
  }
}

export function renderGitHubActionsWorkflow(projectInfo: ProjectInfo): string {
  const steps: WorkflowStep[] = [{ uses: "actions/checkout@v4" }];
  const setupStep = createSetupStep(projectInfo);

  if (setupStep) {
    steps.push(setupStep);
  }

  if (projectInfo.installCommand) {
    steps.push({ run: projectInfo.installCommand });
  }

  if (projectInfo.testCommand) {
    steps.push({ run: projectInfo.testCommand });
  }

  if (projectInfo.buildCommand) {
    steps.push({ run: projectInfo.buildCommand });
  }

  const workflow: WorkflowConfig = {
    name: "CI",
    on: {
      push: { branches: ["main"] },
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
