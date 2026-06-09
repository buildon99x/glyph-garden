# Code Quality Plan

## Large File Risks for Coding Agents

Large TypeScript and CSS files are not only a human maintenance problem. They also make coding-agent work less reliable.

### TypeScript files

When files such as `GardenScene.ts` or `gardenSystem.ts` grow too large:

- Agents must spend more context reading unrelated code before making a small change.
- Similar helper names become easier to confuse.
- Local edits can accidentally cross architecture boundaries, such as putting gameplay rules in Phaser rendering code.
- Review diffs become harder to map to the user's request.
- TypeScript errors often appear far from the edited block because large files accumulate hidden coupling.

### CSS files

When `styles.css` grows too large:

- Selector interactions become harder to predict.
- Responsive fixes can break desktop layout, or desktop fixes can break mobile layout.
- Agent edits may duplicate existing styles instead of reusing the correct rule.
- Visual regressions are harder to verify without screenshots.

## File Size Guidelines

These are warning thresholds, not hard blockers.

| File type | Warning threshold | Action |
|-----------|-------------------|--------|
| Simulation TS | 400 lines | Consider extracting domain helpers such as goals, scoring, candidates, or runes. |
| Phaser scene TS | 350 lines | Consider extracting rendering helpers or glyph drawing utilities. |
| HUD TS | 300 lines | Consider extracting render helpers or small UI components. |
| CSS | 350 lines | Consider splitting by surface: layout, HUD, controls, panels, responsive rules. |

Do not split files mechanically. Split when the extracted module has a clear responsibility and reduces the amount of unrelated code an agent must read.

## Recommended Module Boundaries

- `src/game/simulation/systems/gardenSystem.ts`: turn flow orchestration.
- Future `src/game/simulation/systems/scoring.ts`: scoring helpers.
- Future `src/game/simulation/systems/goals.ts`: goal creation and progress.
- Future `src/game/simulation/systems/candidates.ts`: candidate generation.
- Future `src/phaser/rendering/glyphShapes.ts`: glyph drawing primitives.
- Future `src/styles/`: split CSS only if Vite import flow is updated deliberately.

## Fast Verification Strategy

Use lightweight checks so quality gates do not slow normal iteration.

1. `npm run typecheck`
   - Runs `tsc --noEmit`.
   - Fast and catches TypeScript contract errors.
2. `npm run lint`
   - Runs ESLint only on source TypeScript files.
   - Ignores generated output and dependencies.
3. `npm run check`
   - Runs typecheck and lint together.
   - Use before commits when code changed.
4. `npm run build`
   - Use before shipping or when bundling behavior may be affected.

For CSS, keep the current gate manual for now. Add Stylelint only if CSS churn becomes frequent enough to justify another dependency and command.
