import YAML from "yaml";

import type { ProjectInfo, WorkflowConfig, WorkflowStep } from "../core/types.js";

function createSetupStep(projectInfo: ProjectInfo): WorkflowStep | null {
  if (projectInfo.language !== "node") {
    return null;
  }

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
        runsOn: "ubuntu-latest",
        steps,
      },
    },
  };

  return YAML.stringify(workflow);
}
