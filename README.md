# Glyph Garden

A short-run replayable puzzle game built with Phaser and Vite.

## Play

Choose one of the three glyph candidates, then click an empty plot on the 6x6 board. Each placement scores immediately and may trigger reactions with neighboring glyphs. Complete enough goals before the garden runs out of turns to earn a rune and continue the run.

## Core Loop

- 5 gardens per run
- 12 turns per garden, plus rune modifiers
- 3 candidate glyphs each turn
- 2 world rules per early garden, 3 in late gardens
- 3 goals per garden, usually requiring 2 completed goals to continue
- Rune rewards between successful gardens

## Glyphs

- Seed: modest base score; grows into Bloom when watered
- Water: scores and grows adjacent Seeds
- Bloom: powers row harmony bonuses
- Stone: amplifies adjacent glyphs
- Moth: gains value from Blooms and can move during night rules
- Prism: copies diagonal color and scores from color lines

## Controls

- Click candidate buttons or press `1`, `2`, `3` to select a glyph
- Click an empty board plot to place it
- Press `R` or use Restart to start a new seeded run

## Development

```sh
npm install
npm run dev
npm run check
npm run build
```

The production build verifies TypeScript and creates the deployable bundle in `dist/`.

## Project Knowledge

- `.context/` stores durable working knowledge for maintainers and coding agents.
- `docs/specs/` stores specs.
- `docs/plans/` stores implementation and investigation plans.
- `docs/raw/` stores raw source materials and logs.
- `docs/glossary.md` defines shared project terms.
- `docs/release-checklist.md` lists release review steps.
