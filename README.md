# RepoFlow

RepoFlow is a lightweight CLI that detects your repository type and generates a minimal GitHub Actions CI workflow.

Current status: `P1` is complete. The project can detect `Node.js`, `Python`, and `Go` repositories, preview a GitHub Actions workflow, and generate `.github/workflows/ci.yml` with overwrite confirmation.

## Current Capabilities

- Detect `Node.js`, `Python`, and `Go` repositories
- Infer package managers for `npm`, `pnpm`, `yarn`, `pip`, `poetry`, and `go`
- Read project metadata such as Node scripts, Node runtime, and `go.mod`
- Apply default install / test / build commands through a normalized rules layer
- Preview a minimal GitHub Actions CI workflow in the terminal
- Generate `.github/workflows/ci.yml`
- Ask before overwriting an existing workflow file

## Not Implemented Yet

- `repoflow init`
- Test fixtures for sample repositories
- npm publishing flow

## Requirements

- Node.js `20+`
- npm `10+` recommended

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
```

Build the CLI:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Local CLI Usage

After building, you can link the package locally and use `repoflow` as a real command:

```bash
npm run build
npm link
repoflow detect --cwd /path/to/repo
repoflow preview --cwd /path/to/repo
repoflow generate --cwd /path/to/repo
```

You can also run the built file directly:

```bash
node dist/cli.js detect --cwd /path/to/repo
node dist/cli.js preview --cwd /path/to/repo
node dist/cli.js generate --cwd /path/to/repo
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
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

## Supported Project Types

Current implementation:

- Node.js
- Python
- Go

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

## Roadmap

- Add interactive `repoflow init`
- Add test fixtures for more repository types
- Expand README usage examples
- Prepare npm publishing flow

## License

MIT
