# ADR 0001: Use Release Please for Changelog Automation

- Status: Accepted
- Date: 2026-06-09
- Owners: Project maintainers

## Context

Glyph Garden needs `CHANGELOG.md` to stay product-focused while avoiding manual release bookkeeping. The repository is a single Vite/TypeScript game with `package.json`, so heavyweight monorepo release tooling is unnecessary.

## Decision

Use Release Please with Conventional Commits.

Release Please will open release pull requests that update:

- `CHANGELOG.md`,
- `package.json`,
- `package-lock.json`,
- `.release-please-manifest.json`.

Maintainers must edit generated changelog entries before merging so the final changelog contains player-facing product changes only.

## Consequences

- Release notes are reviewed before publication.
- Repository operations such as agent guidance, CI setup, and internal docs should be removed from `CHANGELOG.md`.
- Commit messages need to remain compatible with Conventional Commits.

## Alternatives Considered

- Changesets: useful for package and monorepo workflows, but heavier than needed.
- conventional-changelog CLI: useful locally, but does not provide the release PR workflow by itself.
- Manual changelog only: highest editorial control, but too easy to forget.
