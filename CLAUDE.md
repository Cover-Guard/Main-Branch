# CLAUDE.md — AI Assistant Guide for coverguard-main

This file provides context and conventions for AI assistants (e.g., Claude Code) working in this repository.

## Project Overview

**Package name**: `coverguard-main`
**Repository**: Cover-Guard/Main-Branch
**Language**: JavaScript / Node.js

This is the main package for the CoverGuard project. As of this writing the repository is in its early setup phase — source code and tooling are not yet established. This file should be updated as the project grows.

## Repository Structure

```
Main-Branch/
├── CLAUDE.md        # This file
├── README.md        # Project readme
└── package.json     # NPM package manifest
```

Source directories (to be created as the project develops):
- `src/`   — application source code
- `test/`  — test files
- `dist/`  — build output (do not commit)

## Git Conventions

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code |
| `master` | Legacy default branch |
| `claude/<task>-<id>` | AI-generated feature branches |

- **Never push directly to `main` or `master`.**
- AI assistants must develop on their designated `claude/` branch and push there.
- Branch names for AI sessions follow the pattern `claude/<short-description>-<sessionId>`.

### Commits

- Commits are **SSH-signed**; do not pass `--no-gpg-sign`.
- Write clear, imperative commit messages (e.g., `Add entry point`, `Fix validation logic`).
- Do not amend published commits; create new ones instead.

### Push

```bash
git push -u origin <branch-name>
```

If the push fails due to a network error, retry up to 4 times with exponential backoff (2 s, 4 s, 8 s, 16 s).

## Development Workflow

Since tooling is not yet configured, the workflow below reflects the intended setup. Update this section once scripts are added to `package.json`.

```bash
# Install dependencies (once added)
npm install

# Run the project (once an entry point exists)
npm start

# Run tests (once a test framework is configured)
npm test

# Build / bundle (once a build step is added)
npm run build
```

## Package Conventions

- **package.json** currently contains only the package name (`coverguard-main`). Add fields (version, description, main, scripts, dependencies) as development progresses.
- Use **semantic versioning** (`MAJOR.MINOR.PATCH`) once the package is published.
- Prefer keeping `devDependencies` separate from runtime `dependencies`.

## Testing

No testing framework is configured yet. When one is added:
- Place test files in `test/` or alongside source files as `*.test.js` / `*.spec.js`.
- All tests must pass before merging to `main`.
- Do not skip or comment out tests to make a build pass.

## Code Style

No linter or formatter is configured yet. When added:
- Run the linter/formatter before committing.
- Do not disable lint rules inline without a comment explaining why.
- Prefer `const` over `let`; avoid `var`.

## Environment Variables

No `.env` file is present. When environment variables are introduced:
- Document each variable in `.env.example` (committed).
- Never commit actual secrets or `.env` files.
- Add `.env` to `.gitignore` immediately.

## CI/CD

No CI/CD pipeline is configured. When one is added, document the workflow files here (e.g., `.github/workflows/`).

## Notes for AI Assistants

1. **Read before editing.** Always read a file before modifying it.
2. **Minimal changes.** Only change what is needed; avoid refactoring unrelated code.
3. **No new files without reason.** Prefer editing existing files over creating new ones.
4. **Keep this file updated.** If you add tooling, scripts, or architectural patterns, update the relevant section of this document.
5. **Check branch.** Confirm you are on the correct `claude/` branch before committing or pushing.
6. **Security.** Never commit credentials, API keys, or secrets.
