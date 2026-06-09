# Playbook: Debug Gameplay Rule

## When to Use

Use this when a glyph, goal, rune, score, chain, or world rule behaves differently than expected.

## Steps

1. Identify the exact rule surface:
   - glyph reaction,
   - score calculation,
   - goal progress,
   - rune effect,
   - world rule modifier,
   - candidate generation.
2. Read the relevant domain types in:

   ```text
   src/game/simulation/state.ts
   ```

3. Read the simulation logic in:

   ```text
   src/game/simulation/systems/gardenSystem.ts
   ```

4. Reproduce with the smallest board state or turn sequence possible.
5. Keep the rule fix in simulation code. Do not patch gameplay behavior in the Phaser scene or HUD.
6. If UI display is also wrong, fix rendering after the simulation behavior is correct.
7. Run:

   ```sh
   npm run check
   ```

8. If the change could affect bundling or runtime startup, also run:

   ```sh
   npm run build
   ```

## Verification

- The minimal reproduction behaves as expected.
- `npm run check` passes.
- HUD and board rendering reflect the corrected simulation state.

## Related Knowledge

- `docs/glossary.md`
- `docs/code-quality-plan.md`
- `.context/kb/lrn/2026-06-09-large-files-agent-risk.md`
