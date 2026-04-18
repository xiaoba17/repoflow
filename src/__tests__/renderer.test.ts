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
    expect(yaml).toContain("uses: actions/checkout@v4");
    expect(yaml).toContain("runs-on: ubuntu-latest");
    expect(yaml).toContain("uses: actions/setup-node@v4");
    expect(yaml).toContain("node-version: 20");
    expect(yaml).toContain("run: pnpm install --frozen-lockfile");
    expect(yaml).toContain("run: pnpm test");
    expect(yaml).toContain("run: pnpm build");
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
});
