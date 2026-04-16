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
    expect(yaml).toContain("uses: actions/setup-node@v4");
    expect(yaml).toContain("node-version: 20");
    expect(yaml).toContain("run: pnpm install --frozen-lockfile");
    expect(yaml).toContain("run: pnpm test");
    expect(yaml).toContain("run: pnpm build");
  });
});
