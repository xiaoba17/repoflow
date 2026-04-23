import { describe, expect, it } from "vitest";

import { renderGitHubActionsWorkflow } from "../renderers/github-actions-renderer.js";

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
        includeBuildStep: true,
        enableCache: false,
        includeLintStep: false,
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
      {
        defaultBranch: "main",
        includeBuildStep: false,
        enableCache: false,
        includeLintStep: false,
      },
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

  it("keeps the default minimal workflow free of cache and lint steps", () => {
    const yaml = renderGitHubActionsWorkflow({
      language: "node",
      packageManager: "npm",
      runtimeVersion: "20",
      installCommand: "npm ci",
      lintCommand: "npm run lint",
      testCommand: "npm test",
      buildCommand: "npm run build",
      ciProvider: "github-actions",
      confidence: 0.95,
    });

    expect(yaml).not.toContain("cache:");
    expect(yaml).not.toContain("run: npm run lint");
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
      {
        defaultBranch: "main",
        includeBuildStep: true,
        enableCache: true,
        includeLintStep: false,
      },
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
      {
        defaultBranch: "main",
        includeBuildStep: true,
        enableCache: true,
        includeLintStep: false,
      },
    );

    expect(yaml).toContain("cache: pip");
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
      {
        defaultBranch: "main",
        includeBuildStep: true,
        enableCache: true,
        includeLintStep: false,
      },
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
      {
        defaultBranch: "main",
        includeBuildStep: false,
        enableCache: true,
        includeLintStep: true,
      },
    );

    expect(yaml).toContain("run: npm run lint");
    expect(yaml.indexOf("run: npm ci")).toBeLessThan(yaml.indexOf("run: npm run lint"));
    expect(yaml.indexOf("run: npm run lint")).toBeLessThan(yaml.indexOf("run: npm test"));
    expect(yaml).not.toContain("run: npm run build");
  });
});
