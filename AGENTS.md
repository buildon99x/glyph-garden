# AGENTS.md

Operating instructions for coding agents working on Glyph Garden. Read this file before every task.

Working code is the standard. A plausible diff is not enough.

This file follows the AGENTS.md convention and is adapted for this repository from the requested reference structure.

---

## 0. Non-negotiables

These rules override everything else in this file when they conflict:

1. Do not add filler. Start with the action, answer, or finding.
2. If the request is based on a wrong premise, say so before editing.
3. Do not invent file paths, commits, APIs, test results, or behavior. Inspect or run the command.
4. If there are two materially different interpretations, ask before changing code.
5. Change only lines that directly support the user's request.

---

## 1. Before writing code

Goal: understand the requested change and the existing game before editing.

- State the intended change and verification check before touching files.
- Read the file you will edit and the files that import or render it.
- Follow the existing Phaser scene, simulation, and HUD separation.
- Surface assumptions clearly, especially when changing game rules or balance.
- If two approaches differ meaningfully, explain the tradeoff before choosing.

---

## 2. Writing code: simplicity first

Goal: solve the stated problem with the smallest maintainable change.

- Do not add features beyond the request.
- Do not add abstractions for one-off behavior.
- Prefer explicit game rules over clever generic systems until duplication proves painful.
- Keep rendering, UI DOM, and simulation state separate.
- If a change can be smaller without losing behavior, make it smaller before showing it.

The test: a reviewer should be able to explain every changed line from the user's request.

---

## 3. Surgical changes

Goal: keep diffs easy to review.

- Do not reformat unrelated code.
- Do not refactor neighboring modules just because you opened them.
- Clean up unused imports, types, and functions created by your own edit.
- Preserve the current file layout unless the task is explicitly architectural.
- Match the existing TypeScript style: ES modules, explicit type imports where appropriate, small pure helpers for simulation logic.

The test: if a line does not support the requested task, leave it unchanged.

---

## 4. Goal-driven execution

Goal: define success as something observable, then verify it.

Rewrite vague tasks into checkable outcomes:

- "Improve clarity" means the player can identify the selected candidate, the placement target, the current goals, and the last move result.
- "Fix a rule" means create or identify a scenario where the rule fails, then verify the corrected behavior.
- "Improve UI" means check desktop and mobile layout for overlap, unreadable text, and missing affordances.
- "Make it shippable" means build succeeds and the game can be launched locally.

For every task:

1. Define success before editing.
2. Add or run the most relevant verification.
3. Read the output.
4. If verification fails, fix the implementation, not the check.

---

## 5. Tool use and verification

- Prefer running the project over guessing.
- Run `npm run build` before calling code changes complete.
- For UI changes, verify visually when a browser tool is available; otherwise confirm the dev server responds and describe the manual check target.
- For game-rule changes, inspect `src/game/simulation/systems/gardenSystem.ts` and confirm the affected state fields in `src/game/simulation/state.ts`.
- For rendering changes, inspect `src/phaser/scenes/GardenScene.ts` and confirm the HUD contract in `src/ui/hud.ts`.
- Read command output fully. Do not summarize a command as passing unless it exited successfully.

---

## 6. Session hygiene

- Keep the working tree in mind. Do not overwrite user changes.
- If the same fix fails twice, stop and summarize what failed before trying a third approach.
- Use clear commit messages under 72 characters for the subject.
- Do not add `Co-Authored-By:` unless the repository history already uses it or the user asks.
- Keep generated or build output out of commits unless explicitly requested.

---

## 7. Communication style

- Be direct and concise.
- Give clear answers when they exist; give tradeoffs when they do not.
- Report concrete files changed and checks run.
- Do not over-celebrate ideas or partial work.
- Avoid excessive bullets for small tasks.

---

## 8. When to ask, when to proceed

Ask before proceeding when:

- A gameplay request could mean different mechanics or balance targets.
- The change could discard existing work or rewrite the project structure.
- A credential, secret, paid service, or production resource is required.
- The user's stated goal conflicts with the literal request.

Proceed without asking when:

- The change is small, local, and reversible.
- The ambiguity can be resolved by reading the code or running a command.
- The user already made the preference clear in this thread.

---

## 9. Self-improvement loop

This file is living guidance for future agents.

After any session where the agent's approach needed correction:

1. Decide whether the mistake came from missing guidance or ignored guidance.
2. If guidance was missing, add one concrete rule under Project Learnings.
3. If guidance was ignored, tighten or move the existing rule.
4. Periodically delete stale rules so this file stays useful.

---

## 10. Project context — Glyph Garden

Glyph Garden is a browser-based replayable puzzle game built with Phaser, Vite, and TypeScript. The player places glyph candidates on a 6x6 board, triggers tile reactions, completes goals, and carries rune rewards through a five-garden run.

Tech stack: TypeScript, Phaser 3, Vite, npm.

### Crate Map

This project is not a Rust crate workspace. Treat this section as the module map.

Dependencies flow from app boot to scene rendering to simulation state. Avoid making simulation code depend on Phaser or DOM APIs.

| Layer | File | Responsibility |
|-------|------|----------------|
| Entry | `src/main.ts` | Creates the Phaser game and mounts the HUD |
| Scene | `src/phaser/scenes/GardenScene.ts` | Board rendering, pointer input, hover previews, score feedback |
| Simulation | `src/game/simulation/state.ts` | Shared game state and domain types |
| Simulation | `src/game/simulation/systems/gardenSystem.ts` | Turn flow, scoring, goals, rules, runes, candidate generation |
| Input | `src/game/input/actions.ts` | Shared input slot types |
| UI | `src/ui/hud.ts` | DOM HUD rendering and callbacks |
| Styles | `src/styles.css` | HUD layout, responsive styles, visual hierarchy |
| Root | `index.html` | Browser document shell |

When adding game behavior, put deterministic rules in `gardenSystem.ts`, state shape in `state.ts`, Phaser-only visuals in `GardenScene.ts`, and DOM-only UI in `hud.ts`.

### Commands

Run from the repo root:

```bash
npm install         # Install dependencies
npm run dev         # Start the Vite dev server
npm run build       # Type-check and build the production bundle
npm run preview     # Serve the production build locally
```

Use `npm run build` as the minimum completion check for code changes. If the task affects UI, also run `npm run dev` and verify the app opens.

### Code style

- Use TypeScript ES modules.
- Prefer `import type` for type-only imports.
- Keep simulation helpers pure where practical.
- Keep comments short and only where the logic is not obvious.
- Do not use `any`; prefer explicit domain types or `unknown` with narrowing.
- Do not silently swallow gameplay errors. If a player action is invalid, set a useful `state.message`.

### File organization

- Keep game rules in `src/game/simulation/`.
- Keep Phaser drawing and effects in `src/phaser/`.
- Keep DOM HUD code in `src/ui/`.
- Keep files focused on one responsibility.
- If a file approaches unwieldy size, extract by domain behavior, not by arbitrary type buckets.

### Architecture principles

#### No Hardcoded Gameplay Exceptions Outside Simulation

Gameplay rules belong in `gardenSystem.ts`. Do not encode scoring, goal progress, rune effects, or tile reactions in the HUD or Phaser scene.

Wrong:

```ts
// Scene code deciding gameplay score.
if (candidate.kind === "water") score += 5;
```

Correct:

```ts
// Scene delegates to simulation.
placeSelectedCandidate(this.state, cell.x, cell.y);
```

If a new rule is needed:

1. Add or update the relevant domain type in `state.ts`.
2. Implement the behavior in `gardenSystem.ts`.
3. Render the result in `GardenScene.ts` or `hud.ts` without duplicating the rule.

#### Centralize Platform Differences

This is a browser game. Platform differences should normally be handled by Vite, Phaser, or CSS. If a command, path, or environment-specific behavior is needed, keep it in documentation or scripts rather than scattering assumptions through app code.

#### No Duplicate Code Across Modules

Do not copy scoring, glyph labels, candidate slot definitions, or goal logic between modules. Export small shared helpers or types from the lowest sensible module when reuse is needed.

### Cross-platform

The game should run in modern desktop browsers and remain usable on smaller screens.

#### Paths

- Do not hardcode absolute local paths in source files.
- Use repo-relative paths in docs.
- Do not commit machine-specific files such as `.DS_Store`.

#### Shell Execution

- Project commands are npm scripts.
- Do not add shell-specific scripts that only work on one platform unless the task explicitly allows it.
- Prefer npm scripts over ad hoc command chains in docs.

### Test organization

There is currently no dedicated test runner beyond TypeScript build verification.

When adding tests:

| Location | What goes there |
|----------|----------------|
| `src/game/simulation/` adjacent test files | Deterministic rule and scoring tests |
| Future UI/e2e test directory | Browser interaction and layout tests |

Tests should verify meaningful gameplay behavior: candidate replacement, rule reactions, goal completion, rune effects, invalid placement handling, and run completion.

### Documentation

Key project references:

| Document | Covers |
|----------|--------|
| `README.md` | Gameplay overview, controls, core loop, development commands |
| `AGENTS.md` | Agent workflow, code boundaries, verification expectations |
| `package.json` | Available npm scripts and dependencies |

Update `README.md` when player-facing controls, core loop, or development commands change.

### Forbidden

- Putting gameplay rules in HUD or Phaser rendering code.
- Committing `node_modules/` or `dist/`.
- Hardcoding secrets, credentials, or machine-local paths.
- Adding new dependencies without a clear need.
- Force-pushing `main` unless the user explicitly asks and the risk is understood.

---

## 11. Project Learnings

Accumulated corrections for future agents. Add concrete one-line rules here when the user corrects the process.

- Use `npm run build` as the minimum verification gate before calling implementation work complete.
