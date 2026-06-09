# CHANGELOG Management Plan

## Recommendation

Use Release Please with Conventional Commits.

Glyph Garden is a single-package GitHub repository with `package.json`, no monorepo package graph, and no separate package publishing requirement yet. Release Please fits this shape because it can:

- read Conventional Commit history,
- open a release pull request,
- update `CHANGELOG.md`,
- bump `package.json` and `package-lock.json`,
- create the GitHub release after the release PR is merged.

This keeps the changelog reviewed by a human while avoiding manual copy-editing every release. The release PR is still an editorial checkpoint: remove repository-operation entries before merging.

## Alternatives Considered

| Option | Fit | Notes |
|--------|-----|-------|
| Release Please | Best fit | GitHub-native, low dependency footprint, creates release PRs instead of silently editing `main`. |
| Changesets | Good for packages/monorepos | Strong when each PR carries a changeset file, but heavier than needed for one Vite game. |
| conventional-changelog CLI | Useful locally | Simple generation from commits, but it does not provide the same release PR workflow by itself. |
| Manual Keep a Changelog | Good fallback | Highest editorial control, but easy to forget and harder to keep consistent. |

## Operating Model

1. Developers write Conventional Commit messages.
2. Pushes to `main` trigger `.github/workflows/release-please.yml`.
3. Release Please opens or updates a release PR.
4. The release PR includes:
   - `CHANGELOG.md` updates,
   - `package.json` version bump,
   - `package-lock.json` version bump,
   - release metadata in `.release-please-manifest.json`.
5. Review the release PR like any other PR.
6. Merge the release PR to create the GitHub release.

## Commit Message Policy

Use this format:

```text
type(scope): summary
```

Scopes are optional but useful. Recommended scopes:

- `game`: simulation, scoring, goals, rules, runes
- `scene`: Phaser board rendering, pointer input, effects
- `hud`: DOM HUD, player-facing labels, panels
- `style`: CSS and responsive layout
- `docs`: README, AGENTS, changelog guidance
- `release`: release workflow and metadata

Use these types:

| Type | Changelog impact | Example |
|------|------------------|---------|
| `feat` | Minor release | `feat(game): add daily challenge seed` |
| `fix` | Patch release | `fix(hud): prevent goal label overflow` |
| `perf` | Patch release | `perf(scene): reduce hover preview redraw cost` |
| `docs` | Exclude unless it changes player-facing instructions | `docs: update controls guide` |
| `chore` | Exclude | `chore: update dependencies` |
| `refactor` | Usually no release entry | `refactor(game): split goal helpers` |
| `test` | Usually no release entry | `test(game): cover water seed reactions` |
| `ci` | Exclude | `ci: add release workflow` |

For breaking changes, use `!` or a `BREAKING CHANGE:` footer:

```text
feat(game)!: replace run scoring model

BREAKING CHANGE: saved run state from previous builds is not compatible.
```

## CHANGELOG Writing Rules

The generated changelog should remain player-facing. It is a product document, not a repository activity log.

- Keep entries about observable changes, not internal implementation details.
- Prefer "Added hover previews for placement planning" over "Changed `renderHoverPreview`".
- Exclude development environment setup, GitHub Actions, coding-agent instructions, dependency maintenance, test-only changes, and internal documentation.
- Include documentation only when it helps the player use the product, such as controls or gameplay rules.
- Do not dump raw commit logs into release notes.
- Edit the release PR changelog text before merging if generated wording is unclear.

### Include / Exclude Examples

| Include in `CHANGELOG.md` | Exclude from `CHANGELOG.md` |
|---------------------------|-----------------------------|
| New glyph types, world rules, goals, runes | `AGENTS.md`, `CLAUDE.md`, coding-agent guidance |
| Player-facing UI clarity improvements | GitHub Actions, release workflow, CI setup |
| Bug fixes that affect gameplay or display | Build tooling, package lock maintenance |
| New controls, accessibility improvements, tutorial changes | Internal refactors with no behavior change |

## Initial Implementation

Implemented files:

- `CHANGELOG.md`
- `.github/workflows/release-please.yml`
- `release-please-config.json`
- `.release-please-manifest.json`

The current baseline version is `0.1.0`.

## Follow-up Plan

1. Enforce Conventional Commits.
   - Add a lightweight `CONTRIBUTING.md` section or commit message examples in `README.md`.
   - Optional: add Commitlint if commit quality becomes inconsistent.
2. Add tests for release-critical game rules.
   - Prioritize deterministic tests for `gardenSystem.ts`.
   - Keep `npm run build` as the minimum release gate.
3. Add a release checklist.
   - Confirm build passes.
   - Review generated `CHANGELOG.md`.
   - Verify package version bump.
   - Merge release PR.
4. Revisit automation after the first release PR.
   - If release notes are too noisy, tune Release Please changelog sections.
   - If commits are too inconsistent, require Conventional Commit checks.

## References

- Release Please: https://github.com/googleapis/release-please
- Release Please Action: https://github.com/googleapis/release-please-action
- Changesets: https://changesets.dev/
- conventional-changelog: https://github.com/conventional-changelog/conventional-changelog
- Conventional Commits: https://www.conventionalcommits.org/
