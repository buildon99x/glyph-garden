# 2026-06-09: Large Files Increase Agent Risk

## Situation

Current project files such as `gardenSystem.ts`, `GardenScene.ts`, and `styles.css` can grow quickly as gameplay, rendering, and UI polish are added.

## Lesson

Large TypeScript and CSS files make agent work less reliable because they increase context cost, hide coupling, and make small edits easier to misplace.

## Action

Use the warning thresholds in `docs/code-quality-plan.md`:

- simulation TypeScript around 400 lines,
- Phaser scene TypeScript around 350 lines,
- HUD TypeScript around 300 lines,
- CSS around 350 lines.

Split only when there is a clear responsibility boundary.

## Evidence

- `docs/code-quality-plan.md`
- `AGENTS.md`
