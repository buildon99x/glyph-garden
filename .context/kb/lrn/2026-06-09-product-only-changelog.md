# 2026-06-09: Product-Only Changelog

## Situation

`CHANGELOG.md` initially included repository operations such as coding-agent instructions and Claude Code compatibility.

## Lesson

The changelog is a product document. It should tell players and users what changed in the game, not list repository maintenance.

## Action

Exclude development environment setup, GitHub workflow changes, dependency maintenance, coding-agent guidance, and internal docs from `CHANGELOG.md`.

Keep these details in docs, ADRs, or release process notes instead.

## Evidence

- `CHANGELOG.md`
- `docs/changelog-management.md`
- `.context/kb/adr/0001-use-release-please-for-changelog.md`
