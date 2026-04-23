# RepoFlow

**Generate a minimal GitHub Actions CI workflow from an existing repository.**

RepoFlow is a lightweight open-source CLI that detects your repository type, infers install / test / build commands, and generates a conservative GitHub Actions CI workflow for existing repositories.

It currently supports **Node.js**, **Python**, and **Go** repositories, with framework hints for **Next.js**, **Vite**, **FastAPI**, and **Gin**. RepoFlow can preview workflow YAML in the terminal, generate `.github/workflows/ci.yml`, and guide setup through an interactive `init` flow.

## Why RepoFlow

Writing a CI workflow is easy when you already know:

- which runtime version to use,
- which package manager the repo expects,
- which install command is safe,
- whether a build step should exist at all.

RepoFlow helps with that first layer.

It can:

- detect the repo type,
- infer a package manager and common commands,
- preview the workflow before writing files,
- fail conservatively on unsupported projects instead of guessing too much.

## Quick Start

Install from npm:

```bash
npm install -g @xiaoba17/repoflow
```

Inspect a repository:

```bash
repoflow detect --cwd /path/to/repo
```

Preview a workflow without writing files:

```bash
repoflow preview --cwd /path/to/repo
```

Generate `.github/workflows/ci.yml`:

```bash
repoflow generate --cwd /path/to/repo
```

Run the guided setup flow:

```bash
repoflow init --cwd /path/to/repo
```

Important behavior:

- `preview` and `generate` keep the minimal workflow template by default.
- `init` is where optional enhancements such as cache and lint are exposed.

## Example Detection Output

```json
{
  "language": "node",
  "framework": "nextjs",
  "packageManager": "pnpm",
  "runtimeVersion": "20",
  "installCommand": "pnpm install --frozen-lockfile",
  "testCommand": "pnpm test",
  "buildCommand": "pnpm build",
  "ciProvider": "github-actions",
  "confidence": 0.95
}
```

## Example Workflow Preview

```yaml
name: CI
on:
  push:
    branches:
      - main
  pull_request: {}
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

## Works Well For

- existing single-repo projects that need a minimal CI quickly,
- repositories where install / test / build steps can be inferred from common conventions,
- teams that want to preview generated YAML before writing files.

## Not a Fit For

- highly customized CI/CD pipelines,
- advanced release automation,
- deployment orchestration and secrets-heavy workflows,
- unsupported or ambiguous project layouts.

## Requirements

- Node.js `20+`
- npm `10+` recommended

## Installation

RepoFlow is currently distributed as an npm CLI package.

```bash
npm install -g @xiaoba17/repoflow
```

Notes:

- GitHub Releases currently provide source snapshots and release notes only.
- Standalone native binaries are not published yet.
- The installed CLI command is `repoflow`.

## Commands

### `repoflow detect`

Scans a repository and prints normalized detection output as JSON.

```bash
repoflow detect --cwd /path/to/repo
```

### `repoflow preview`

Generates a GitHub Actions workflow preview and prints it to stdout without writing any files.

```bash
repoflow preview --cwd /path/to/repo
```

### `repoflow generate`

Generates `.github/workflows/ci.yml` for a supported repository.

Behavior:

- creates `.github/workflows` if it does not exist,
- prompts before overwriting an existing `ci.yml`,
- fails conservatively for unknown project types.

```bash
repoflow generate --cwd /path/to/repo
```

### `repoflow init`

Runs a guided setup flow for `.github/workflows/ci.yml`.

Flow:

- confirms the detected project type,
- lets you choose the default branch: `main` or `master`,
- lets you keep or remove the detected build step when one exists,
- can enable dependency cache for supported projects,
- can add a lint step when a Node project declares `scripts.lint`,
- shows the final YAML preview before writing,
- asks before overwriting an existing workflow.

```bash
repoflow init --cwd /path/to/repo
```

## Supported Project Types

### Languages

- Node.js
- Python
- Go

### Framework Hints

- Next.js
- Vite
- FastAPI
- Gin

### Default Runtime and Command Behavior

- Node.js: default runtime `20`
- Python: default runtime `3.11`
- Go: default runtime `1.22`

Package manager defaults:

- `npm`: `npm ci`
- `pnpm`: `pnpm install --frozen-lockfile`
- `yarn`: `yarn install --frozen-lockfile`
- `pip`: `pip install -r requirements.txt`
- `poetry`: `poetry install --no-interaction`, `poetry run pytest`
- `go`: `go mod download`, `go test ./...`, `go build ./...`

## Fixtures

The repository includes minimal sample projects under `fixtures/`, including:

- `fixtures/node-existing-workflow`
- `fixtures/node-npm`
- `fixtures/node-pnpm`
- `fixtures/node-yarn`
- `fixtures/node-nextjs`
- `fixtures/node-vite`
- `fixtures/node-lint`
- `fixtures/python-basic`
- `fixtures/python-fastapi`
- `fixtures/python-poetry`
- `fixtures/go-basic`
- `fixtures/go-gin`

These fixtures serve both as sample repositories and as regression inputs for CLI tests.

## Validation

RepoFlow already includes a few useful quality signals:

- fixture-backed sample coverage,
- a slim npm package focused on runtime assets,
- a documented release-readiness check,
- a GitHub Actions workflow that validates the main development baseline.

### Publish Readiness

Run the release-readiness check:

```bash
npm run release:check
```

This runs:

- `npm test`
- `npm run build`
- `npm run pack:dry-run`

The published npm package is intentionally slimmed down to runtime assets only:

- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

The `pack:dry-run` script uses a temporary npm cache directory to avoid local cache permission issues.

### Continuous Validation

The repository CI baseline validates the project with:

- `npm ci`
- `npm test`
- `npm run build`

## Development

Install dependencies:

```bash
npm install
```

Run commands directly from TypeScript source:

```bash
npm run dev -- detect --cwd /path/to/repo
npm run dev -- preview --cwd /path/to/repo
npm run dev -- generate --cwd /path/to/repo
npm run dev -- init --cwd /path/to/repo
```

Build the CLI:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Use the CLI locally after linking:

```bash
npm run build
npm link
repoflow detect --cwd /path/to/repo
repoflow preview --cwd /path/to/repo
repoflow generate --cwd /path/to/repo
repoflow init --cwd /path/to/repo
```

You can also run the built file directly:

```bash
node dist/cli.js detect --cwd /path/to/repo
node dist/cli.js preview --cwd /path/to/repo
node dist/cli.js generate --cwd /path/to/repo
node dist/cli.js init --cwd /path/to/repo
```

## Roadmap

- deepen GitHub Actions workflow enhancements,
- expand framework-aware detection,
- organize workflow capabilities more clearly,
- move toward conservative release workflow support.

## License

MIT
