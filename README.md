# RepoFlow

RepoFlow is a lightweight CLI that detects your repository type and generates a minimal GitHub Actions CI workflow.

Current status: `P0` is complete. The project can detect basic Node.js repositories and preview a GitHub Actions workflow. File generation and Python/Go support are planned next.

## Current Capabilities

- Detect basic `Node.js` repositories from `package.json`
- Infer package manager from `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock`
- Read `scripts.test`, `scripts.build`, and `engines.node`
- Infer default install commands for `npm`, `pnpm`, and `yarn`
- Preview a minimal GitHub Actions CI workflow in the terminal

## Not Implemented Yet

- Python detection
- Go detection
- `repoflow generate`
- `repoflow init`
- Existing workflow overwrite confirmation

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
```

You can also run the built file directly:

```bash
node dist/cli.js detect --cwd /path/to/repo
node dist/cli.js preview --cwd /path/to/repo
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
    runsOn: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

## Supported Project Types

Current implementation:

- Node.js

Planned next:

- Python
- Go

## Roadmap

- Add Python and Go detectors
- Add `repoflow generate`
- Add interactive `repoflow init`
- Add test fixtures for more repository types
- Prepare npm publishing flow

## License

MIT
