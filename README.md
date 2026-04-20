# RepoFlow

RepoFlow is a lightweight CLI that detects your repository type and generates a minimal GitHub Actions CI workflow.

Current status: `P4` is complete. The project can detect `Node.js`, `Python`, and `Go` repositories, identify a first set of common frameworks, preview and generate GitHub Actions workflows, guide users through an interactive `init` flow, and validate release readiness with a slimmer npm package plus fixture-backed regression coverage.

CLI failures are reported as a single-line error on stderr with a non-zero exit code, while user-cancelled interactive flows exit cleanly without writing files.

## Current Capabilities

- Detect `Node.js`, `Python`, and `Go` repositories
- Detect framework hints for `Next.js`, `Vite`, `FastAPI`, and `Gin`
- Infer package managers for `npm`, `pnpm`, `yarn`, `pip`, `poetry`, and `go`
- Read project metadata such as Node scripts, Node runtime, and `go.mod`
- Apply default install / test / build commands through a normalized rules layer
- Preview a minimal GitHub Actions CI workflow in the terminal
- Generate `.github/workflows/ci.yml`
- Ask before overwriting an existing workflow file
- Guide setup through `repoflow init`
- Provide fixture repositories for sample inputs and regression coverage

## Not Implemented Yet

- Automated release workflow
- Enhanced workflow options such as dependency cache and lint steps

## Requirements

- Node.js `20+`
- npm `10+` recommended

## Install

RepoFlow is currently distributed as an npm CLI package.

Install from npm:

```bash
npm install -g repoflow
```

Notes:

- GitHub Releases currently provide source snapshots and release notes only.
- Standalone native binaries are not published yet.

## Install Dependencies

```bash
npm install
```

## Development

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

Run the repository CI baseline locally:

```bash
npm run build
```

## Local CLI Usage

After building, you can link the package locally and use `repoflow` as a real command:

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

## Commands

### `repoflow detect`

Scans a repository and prints normalized detection output as JSON.

Example:

```bash
repoflow detect --cwd /path/to/repo
```

Example output:

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

### `repoflow preview`

Generates a GitHub Actions workflow preview and prints it to stdout without writing any files.

Example:

```bash
repoflow preview --cwd /path/to/repo
```

Example output:

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

### `repoflow generate`

Generates `.github/workflows/ci.yml` for a supported repository.

Behavior:

- Creates `.github/workflows` if it does not exist
- Prompts before overwriting an existing `ci.yml`
- Fails conservatively for unknown project types

Example:

```bash
repoflow generate --cwd /path/to/repo
```

Example output:

```text
/path/to/repo/.github/workflows/ci.yml
```

### `repoflow init`

Runs a guided setup flow for `.github/workflows/ci.yml`.

Flow:

- Confirms the detected project type
- Lets you choose the default branch: `main` or `master`
- Lets you keep or remove the detected build step when one exists
- Shows the final YAML preview before writing
- Asks before overwriting an existing workflow

Example:

```bash
repoflow init --cwd /path/to/repo
```

## Supported Project Types

Current implementation:

- Node.js
- Python
- Go

Framework detection:

- Next.js
- Vite
- FastAPI
- Gin

Default runtime and command behavior:

- Node.js: default runtime `20`
- Python: default runtime `3.11`
- Go: default runtime `1.22`
- `npm`: `npm ci`
- `pnpm`: `pnpm install --frozen-lockfile`
- `yarn`: `yarn install --frozen-lockfile`
- `pip`: `pip install -r requirements.txt`
- `poetry`: `poetry install --no-interaction`, `poetry run pytest`
- `go`: `go mod download`, `go test ./...`, `go build ./...`

## Fixtures

The repository includes minimal sample projects under `fixtures/`:

- `fixtures/node-existing-workflow`
- `fixtures/node-npm`
- `fixtures/node-pnpm`
- `fixtures/node-yarn`
- `fixtures/node-nextjs`
- `fixtures/node-vite`
- `fixtures/python-basic`
- `fixtures/python-fastapi`
- `fixtures/python-poetry`
- `fixtures/go-basic`
- `fixtures/go-gin`

These fixtures are used both as example repositories and as regression inputs for CLI tests.

## Publish Readiness

The published npm package is intentionally slimmed down to runtime assets only:

- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

Release checks are fixed as npm scripts so local validation stays consistent with the documented flow.

Run the full release readiness check:

```bash
npm run release:check
```

This runs:

- `npm test`
- `npm run build`
- `npm run pack:dry-run`

The `pack:dry-run` script uses a temporary npm cache directory to avoid local cache permission issues.

## Continuous Validation

The repository GitHub Actions workflow continuously validates the main development baseline with:

- `npm ci`
- `npm test`
- `npm run build`

## Roadmap

- Add more fixture repositories and scenario coverage
- Explore Dockerfile generation and additional CI templates
- Add enhanced workflow options such as cache and lint steps

## License

MIT
