# Playbook: Release Changelog Review

## When to Use

Use this when Release Please opens or updates a release pull request.

## Steps

1. Review generated `CHANGELOG.md` entries.
2. Remove entries that are not player-facing product changes.
3. Keep gameplay, controls, UI clarity, accessibility, and player-visible fixes.
4. Exclude CI, coding-agent files, dependency maintenance, internal docs, and test-only changes.
5. Confirm version changes in:
   - `package.json`
   - `package-lock.json`
   - `.release-please-manifest.json`
6. Run:

   ```sh
   npm run build
   ```

## Verification

- The changelog reads like product release notes.
- The build passes.
- The release PR contains the expected version bump.

## Related Knowledge

- `docs/changelog-management.md`
- `.context/kb/adr/0001-use-release-please-for-changelog.md`
- `.context/kb/lrn/2026-06-09-product-only-changelog.md`
