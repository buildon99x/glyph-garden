# Spec: Glyph Garden Initial Game Design

- Status: Accepted
- Date: 2026-06-09
- Owner: Project maintainers

## Game Title

Glyph Garden

## One-Line Concept

Glyph Garden is a roguelite puzzle game where players place glyph tiles on a small procedurally refreshed garden board, build chain-reaction rule engines, and chase the highest possible score within a limited number of turns.

## Core Fun

The player places one glyph tile at a time on a 6x6 board. Each tile reacts with neighboring tiles through specific rules. The game is not just about matching colors. The central fun is reading each garden's rule combination and discovering the scoring engine for that run.

Good play should feel like building a small machine: the player sees a board state, chooses a tile, predicts reactions, and gets rewarded when the system blooms into a chain.

## Example Tiles

| Tile | Effect |
|------|--------|
| Seed | Scores +2 for each adjacent Water. |
| Water | Grows adjacent Seeds into Blooms. |
| Bloom | Grants a bonus when 3 or more Blooms are in the same row. |
| Stone | Scores low, but doubles adjacent tile effects. |
| Moth | Moves toward the highest-scoring tile at the end of the turn. |
| Prism | Copies the color of a diagonal tile. |

## Core Loop

1. At the start of each garden, generate a random board, tile pool, and 3 goals.
2. Each turn, the player chooses 1 of 3 candidate tiles.
3. The player places the chosen tile on the board.
4. Neighbor effects trigger and may cause chain reactions.
5. When the turn limit ends, calculate score and goal completion.
6. Completed goals grant a rune or unlock choice to carry into the next garden.

## Replayability Structure

Replayability comes from three systems.

### 1. Different Rules Each Garden

Each garden receives 2 world rules.

Examples:

| Rule | Effect |
|------|--------|
| Rain Garden | Water effect +1. |
| Night Garden | Moth moves 2 tiles. |
| Dry Soil | Seed scores 0 unless adjacent to Water. |
| Crystal Season | Prism's copied tile effect triggers immediately. |

The same tile should support different strategies depending on the rule combination.

### 2. Short Runs

Each run should take about 10 minutes.

Run structure:

- 1 run = 5 gardens.
- Each garden = 12 turns.
- From garden 3 onward, add variant rules.
- Garden 5 behaves like a boss puzzle with a special goal.

The run should be short enough to encourage "one more run" behavior.

### 3. Permanent Unlocks as Horizontal Growth

Long-term progression should expand options rather than simply increase power.

Unlock examples:

- new tile sets,
- new world rules,
- starting runes,
- high-difficulty goals,
- board shape variants.

The game should become more varied over time, not merely easier.

## Win Conditions

Each garden has 3 goals.

Example goals:

- Score 80 or more.
- Create 8 Blooms.
- Trigger Stone-amplified tiles 5 times.
- Leave 4 or fewer empty spaces.
- Gain 20 points from a single chain.

Progression rule:

- Complete at least 2 goals to continue to the next garden.
- Complete all 3 goals to receive a bonus choice.

## Difficulty Curve

Early gardens should focus on intuitive adjacency rules.

### Early

- same-color matching,
- adjacency bonuses,
- row/column completion.

### Mid

- diagonal interactions,
- moving tiles,
- copy/transform effects,
- conditional triggers.

### Late

- delayed turn effects,
- conflicting goals,
- board obstacles,
- puzzles where structure matters more than raw score.

## Player Choices

Between gardens, the player chooses 1 reward.

Examples:

- Fix the first tile in the next garden.
- Always include 1 Water among the candidates.
- Stone score +3.
- Remove 1 empty space and gain +10 score.
- Replace 1 goal.

These choices should change the next garden's strategy and sustain replayability.

## Visual Style

The game should feel like a small tactile board game about gardens, runes, and glyphs. Effects should emphasize tiles reacting and coming alive rather than spectacle.

Recommended tone:

- hand-drawn-feeling glyph tiles,
- bright natural colors plus mysterious rune colors,
- soft light trails when chains trigger,
- result screens organized like a plant field guide.

## Prototype MVP

### Required

- 6x6 board.
- 6 tile types.
- 3 candidate tile choices.
- 12-turn limit.
- 3 goals.
- score calculation.
- 2 random world rules.
- result screen.
- restart into the next garden.

### Later

- full run structure,
- unlocks,
- rune rewards,
- boss puzzle,
- daily challenge.

## Core Design Principle

A good Glyph Garden board should not feel like solving one fixed answer. It should feel like building a rule engine that the player understands just in time.

The target emotional beat is the final turns moment where the player thinks: "If I place this here, the whole thing will fire."

## Acceptance Criteria

- The product concept is documented in `docs/specs/`.
- The spec explains the core loop, tile examples, replayability structure, win conditions, difficulty curve, player choices, visual style, MVP scope, and design principle.
- Future gameplay changes can reference this spec as the initial design baseline.
