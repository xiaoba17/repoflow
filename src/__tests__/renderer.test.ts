import { describe, expect, it } from "vitest";

import type { WorkflowOptions } from "../core/types.js";
import { renderGitHubActionsWorkflow } from "../renderers/github-actions-renderer.js";

function createWorkflowOptions(overrides: Partial<WorkflowOptions> = {}): WorkflowOptions {
  return {
    defaultBranch: overrides.defaultBranch ?? "main",
    profile: overrides.profile ?? "minimal",
    includeBuildStep: overrides.includeBuildStep ?? true,
    capabilities: {
      cache: overrides.capabilities?.cache ?? false,
      lint: overrides.capabilities?.lint ?? false,
      typecheck: overrides.capabilities?.typecheck ?? false,
      format: overrides.capabilities?.format ?? false,
      coverage: overrides.capabilities?.coverage ?? false,
      coverageArtifact: overrides.capabilities?.coverageArtifact ?? false,
    },
  };
}

describe("renderGitHubActionsWorkflow", () => {
  it("renders a minimal node CI workflow", () => {
    const yaml = renderGitHubActionsWorkflow({
      language: "node",
      packageManager: "pnpm",
      runtimeVersion: "20",
      installCommand: "pnpm install --frozen-lockfile",
      testCommand: "pnpm test",
      buildCommand: "pnpm build",
      ciProvider: "github-actions",
      confidence: 0.95,
    });

    expect(yaml).toContain("name: CI");
    expect(yaml).toContain("push:");
    expect(yaml).toContain("branches:");
    expect(yaml).toContain("- main");
    expect(yaml).toContain("uses: actions/checkout@v6");
    expect(yaml).toContain("runs-on: ubuntu-latest");
    expect(yaml).toContain("uses: actions/setup-node@v6");
    expect(yaml).toContain("node-version: 20");
    expect(yaml).toContain("run: pnpm install --frozen-lockfile");
    expect(yaml).toContain("run: pnpm test");
    expect(yaml).toContain("run: pnpm build");
  });

  it("renders a workflow against the selected default branch", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      {
        defaultBranch: "master",
        profile: "minimal",
        includeBuildStep: true,
        capabilities: {
          cache: false,
          lint: false,
          typecheck: false,
          format: false,
        },
      },
    );

    expect(yaml).toContain("- master");
  });

  it("omits the build step when build is disabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({ includeBuildStep: false }),
    );

    expect(yaml).not.toContain("run: npm run build");
  });

  it("renders a minimal python CI workflow", () => {
    const yaml = renderGitHubActionsWorkflow({
      language: "python",
      packageManager: "poetry",
      runtimeVersion: "3.11",
      installCommand: "poetry install --no-interaction",
      testCommand: "poetry run pytest",
      ciProvider: "github-actions",
      confidence: 0.9,
    });

    expect(yaml).toContain("uses: actions/setup-python@v5");
    expect(yaml).toContain('python-version: "3.11"');
    expect(yaml).toContain("run: poetry install --no-interaction");
    expect(yaml).toContain("run: poetry run pytest");
  });

  it("renders a minimal go CI workflow", () => {
    const yaml = renderGitHubActionsWorkflow({
      language: "go",
      packageManager: "go",
      runtimeVersion: "1.22",
      installCommand: "go mod download",
      testCommand: "go test ./...",
      buildCommand: "go build ./...",
      ciProvider: "github-actions",
      confidence: 0.9,
    });

    expect(yaml).toContain("uses: actions/setup-go@v5");
    expect(yaml).toContain('go-version: "1.22"');
    expect(yaml).toContain("run: go mod download");
    expect(yaml).toContain("run: go test ./...");
    expect(yaml).toContain("run: go build ./...");
  });

  it("keeps the default minimal workflow free of enhanced quality steps", () => {
    const yaml = renderGitHubActionsWorkflow({
      language: "node",
      packageManager: "npm",
      runtimeVersion: "20",
      installCommand: "npm ci",
      lintCommand: "npm run lint",
      typecheckCommand: "npm run typecheck",
      formatCheckCommand: "npm run format",
      testCommand: "npm test",
      buildCommand: "npm run build",
      ciProvider: "github-actions",
      confidence: 0.95,
    });

    expect(yaml).not.toContain("cache:");
    expect(yaml).not.toContain("run: npm run lint");
    expect(yaml).not.toContain("run: npm run typecheck");
    expect(yaml).not.toContain("run: npm run format");
  });

  it("adds node dependency cache when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "pnpm",
        runtimeVersion: "20",
        installCommand: "pnpm install --frozen-lockfile",
        testCommand: "pnpm test",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: true, lint: false, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("cache: pnpm");
  });

  it("adds pip cache when enabled for python", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "python",
        packageManager: "pip",
        runtimeVersion: "3.11",
        installCommand: "pip install -r requirements.txt",
        testCommand: "pytest",
        ciProvider: "github-actions",
        confidence: 0.9,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: true, lint: false, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("cache: pip");
  });

  it("adds poetry cache when enabled for python", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "python",
        packageManager: "poetry",
        runtimeVersion: "3.11",
        installCommand: "poetry install --no-interaction",
        testCommand: "poetry run pytest",
        ciProvider: "github-actions",
        confidence: 0.9,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: true, lint: false, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("cache: poetry");
  });

  it("adds go module cache when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "go",
        packageManager: "go",
        runtimeVersion: "1.22",
        installCommand: "go mod download",
        testCommand: "go test ./...",
        ciProvider: "github-actions",
        confidence: 0.9,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: true, lint: false, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("cache: true");
  });

  it("places lint between install and test when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        lintCommand: "npm run lint",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        includeBuildStep: false,
        capabilities: { cache: true, lint: true, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("run: npm run lint");
    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run lint"));
    expect(yaml.indexOf("run: npm run lint")).toBeLessThan(yaml.indexOf("run: npm test"));
    expect(yaml).not.toContain("run: npm run build");
  });

  it("places python lint between install and test when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "python",
        packageManager: "poetry",
        runtimeVersion: "3.11",
        installCommand: "poetry install --no-interaction",
        lintCommand: "poetry run ruff check .",
        testCommand: "poetry run pytest",
        ciProvider: "github-actions",
        confidence: 0.9,
      },
      createWorkflowOptions({
        profile: "enhanced",
        includeBuildStep: false,
        capabilities: { cache: true, lint: true, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("run: poetry run ruff check .");
    expect(yaml.indexOf("run: poetry install --no-interaction")).toBeLessThan(
      yaml.indexOf("run: poetry run ruff check ."),
    );
    expect(yaml.indexOf("run: poetry run ruff check .")).toBeLessThan(
      yaml.indexOf("run: poetry run pytest"),
    );
  });

  it("places go lint between install and test when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "go",
        packageManager: "go",
        runtimeVersion: "1.22",
        installCommand: "go mod download",
        lintCommand: "golangci-lint run",
        testCommand: "go test ./...",
        ciProvider: "github-actions",
        confidence: 0.9,
      },
      createWorkflowOptions({
        profile: "enhanced",
        includeBuildStep: false,
        capabilities: { cache: true, lint: true, typecheck: false, format: false },
      }),
    );

    expect(yaml).toContain("run: golangci-lint run");
    expect(yaml.indexOf("run: go mod download")).toBeLessThan(
      yaml.indexOf("run: golangci-lint run"),
    );
    expect(yaml.indexOf("run: golangci-lint run")).toBeLessThan(
      yaml.indexOf("run: go test ./..."),
    );
  });

  it("adds a detected typecheck step when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        typecheckCommand: "npm run typecheck",
        testCommand: "npm test",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: false, lint: false, typecheck: true, format: false },
      }),
    );

    expect(yaml).toContain("run: npm run typecheck");
    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run typecheck"));
    expect(yaml.indexOf("run: npm run typecheck")).toBeLessThan(yaml.indexOf("run: npm test"));
  });

  it("adds a detected format check step when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        formatCheckCommand: "npm run format",
        testCommand: "npm test",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: false, lint: false, typecheck: false, format: true },
      }),
    );

    expect(yaml).toContain("run: npm run format");
    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run format"));
    expect(yaml.indexOf("run: npm run format")).toBeLessThan(yaml.indexOf("run: npm test"));
  });

  it("keeps enhanced quality steps in a fixed order", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        lintCommand: "npm run lint",
        typecheckCommand: "npm run typecheck",
        formatCheckCommand: "npm run format",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: { cache: false, lint: true, typecheck: true, format: true },
      }),
    );

    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run lint"));
    expect(yaml.indexOf("run: npm run lint")).toBeLessThan(yaml.indexOf("run: npm run typecheck"));
    expect(yaml.indexOf("run: npm run typecheck")).toBeLessThan(yaml.indexOf("run: npm run format"));
    expect(yaml.indexOf("run: npm run format")).toBeLessThan(yaml.indexOf("run: npm test"));
    expect(yaml.indexOf("run: npm test")).toBeLessThan(yaml.indexOf("run: npm run build"));
  });

  it("adds a detected coverage step when enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        coverageCommand: "npm run coverage",
        testCommand: "npm test",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: {
          cache: false,
          lint: false,
          typecheck: false,
          format: false,
          coverage: true,
          coverageArtifact: false,
        },
      }),
    );

    expect(yaml).toContain("run: npm run coverage");
    expect(yaml.indexOf("run: npm run coverage")).toBeLessThan(yaml.indexOf("run: npm test"));
  });

  it("uploads a coverage artifact only when the path is detected and enabled", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        coverageCommand: "npm run coverage",
        coverageArtifactPath: "coverage/lcov.info",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: {
          cache: false,
          lint: false,
          typecheck: false,
          format: false,
          coverage: true,
          coverageArtifact: true,
        },
      }),
    );

    expect(yaml).toContain("uses: actions/upload-artifact@v4");
    expect(yaml).toContain("name: coverage-report");
    expect(yaml).toContain("path: coverage/lcov.info");
    expect(yaml.indexOf("run: npm run build")).toBeLessThan(
      yaml.indexOf("uses: actions/upload-artifact@v4"),
    );
  });

  it("does not upload a coverage artifact when the coverage step is unavailable", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        coverageArtifactPath: "coverage/lcov.info",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: {
          cache: false,
          lint: false,
          typecheck: false,
          format: false,
          coverage: true,
          coverageArtifact: true,
        },
      }),
    );

    expect(yaml).not.toContain("uses: actions/upload-artifact@v4");
  });

  it("keeps enhanced quality and coverage steps in a fixed order", () => {
    const yaml = renderGitHubActionsWorkflow(
      {
        language: "node",
        packageManager: "npm",
        runtimeVersion: "20",
        installCommand: "npm ci",
        lintCommand: "npm run lint",
        typecheckCommand: "npm run typecheck",
        formatCheckCommand: "npm run format",
        coverageCommand: "npm run coverage",
        coverageArtifactPath: "coverage/lcov.info",
        testCommand: "npm test",
        buildCommand: "npm run build",
        ciProvider: "github-actions",
        confidence: 0.95,
      },
      createWorkflowOptions({
        profile: "enhanced",
        capabilities: {
          cache: false,
          lint: true,
          typecheck: true,
          format: true,
          coverage: true,
          coverageArtifact: true,
        },
      }),
    );

    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run lint"));
    expect(yaml.indexOf("run: npm run lint")).toBeLessThan(yaml.indexOf("run: npm run typecheck"));
    expect(yaml.indexOf("run: npm run typecheck")).toBeLessThan(yaml.indexOf("run: npm run format"));
    expect(yaml.indexOf("run: npm run format")).toBeLessThan(yaml.indexOf("run: npm run coverage"));
    expect(yaml.indexOf("run: npm run coverage")).toBeLessThan(yaml.indexOf("run: npm test"));
    expect(yaml.indexOf("run: npm test")).toBeLessThan(yaml.indexOf("run: npm run build"));
    expect(yaml.indexOf("run: npm run build")).toBeLessThan(
      yaml.indexOf("uses: actions/upload-artifact@v4"),
    );
  });
});
