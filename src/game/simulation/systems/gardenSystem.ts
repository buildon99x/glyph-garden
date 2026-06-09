import type { CandidateSlot } from "../../input/actions";
import type {
  CandidateTile,
  GardenState,
  GlyphColor,
  GlyphKind,
  GlyphTile,
  Goal,
  GoalId,
  GridPoint,
  Rune,
  RuneId,
  RuleId,
  WorldRule
} from "../state";

const BOARD_SIZE = 6;
const RUN_LENGTH = 5;
const BASE_TURNS = 12;
const KIND_POOL: GlyphKind[] = ["seed", "water", "bloom", "stone", "moth", "prism"];
const COLOR_POOL: GlyphColor[] = ["green", "blue", "gold", "violet"];

const ruleBook: Record<RuleId, WorldRule> = {
  rain: { id: "rain", name: "Rain Garden", text: "Water adds +2 more points and grows Seeds more often." },
  night: { id: "night", name: "Night Garden", text: "Moths score +4 and move after each placement." },
  dry: { id: "dry", name: "Dry Soil", text: "Seeds score 0 unless a Water tile is adjacent." },
  crystal: { id: "crystal", name: "Crystal Season", text: "Prisms trigger copied color bonuses immediately." },
  oldStone: { id: "oldStone", name: "Old Stone", text: "Stone amplification is stronger but Stone itself scores less." },
  wildRows: { id: "wildRows", name: "Wild Rows", text: "Rows with 3+ Blooms award a larger harmony bonus." },
  quietMoths: { id: "quietMoths", name: "Quiet Moths", text: "Moths do not move, but each adjacent Bloom gives them +3." }
};

const runeBook: Record<RuneId, Rune> = {
  springWell: { id: "springWell", name: "Spring Well", text: "Every new garden starts with a Water tile in the center." },
  stoneHeart: { id: "stoneHeart", name: "Stone Heart", text: "Stone gives +1 base score and amplifies both orthogonal and diagonal neighbors." },
  moonLamp: { id: "moonLamp", name: "Moon Lamp", text: "Moths gain +2 score and count double for Moth goals." },
  prismLens: { id: "prismLens", name: "Prism Lens", text: "Prisms add +2 score for every matching color in their row." },
  extraTurn: { id: "extraTurn", name: "Patient Season", text: "Each garden has 1 extra turn." },
  goalSwap: { id: "goalSwap", name: "Flexible Vow", text: "Only 1 achieved goal is needed to continue after gardens 1 and 2." }
};

export function createGardenState(seed = Date.now() % 100000): GardenState {
  const state: GardenState = {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    phase: "playing",
    garden: 1,
    maxGardens: RUN_LENGTH,
    turn: 1,
    maxTurns: BASE_TURNS,
    totalScore: 0,
    gardenScore: 0,
    bestChain: 0,
    selectedSlot: 0,
    board: Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null),
    candidates: [],
    rules: [],
    goals: [],
    runes: [],
    rewardChoices: [],
    message: "Choose a glyph, place it, and build a scoring engine before the season ends.",
    lastPlacement: null,
    nextEntityId: 1,
    seed
  };
  startGarden(state, seed);
  return state;
}

export function selectCandidate(state: GardenState, slot: CandidateSlot): void {
  if (state.phase !== "playing") {
    return;
  }
  state.selectedSlot = slot;
}

export function placeSelectedCandidate(state: GardenState, x: number, y: number): void {
  if (state.phase !== "playing") {
    return;
  }
  if (!inside(state, x, y)) {
    return;
  }
  if (tileAt(state, x, y)) {
    state.message = "That plot already holds a glyph.";
    return;
  }

  const candidate = state.candidates[state.selectedSlot];
  if (!candidate) {
    return;
  }

  clearChangeFlags(state);
  const tile: GlyphTile = {
    ...candidate,
    x,
    y,
    score: 0,
    amplified: false,
    justChanged: true
  };
  setTile(state, tile);

  const result = resolvePlacement(state, tile);
  state.gardenScore += result.score;
  state.totalScore += result.score;
  state.bestChain = Math.max(state.bestChain, result.chain);
  state.lastPlacement = result;
  state.turn += 1;
  state.candidates[state.selectedSlot] = drawCandidate(state);
  updateGoals(state);

  const changedText = result.changed.length > 1 ? ` ${result.changed.map(labelForGlyph).join(", ")} reacted.` : "";
  state.message = `${labelForGlyph(tile.kind)} scored ${result.score}. Chain ${result.chain}.${changedText}`;

  if (state.turn > state.maxTurns || state.board.every(Boolean)) {
    finishGarden(state);
  }
}

export function chooseRune(state: GardenState, runeId: RuneId): void {
  if (state.phase !== "reward") {
    return;
  }
  const chosen = state.rewardChoices.find((rune) => rune.id === runeId);
  if (!chosen) {
    return;
  }
  if (!state.runes.some((rune) => rune.id === chosen.id)) {
    state.runes.push(chosen);
  }
  state.garden += 1;
  if (state.garden > state.maxGardens) {
    state.phase = "won";
    state.message = `Run complete. Final score: ${state.totalScore}.`;
    return;
  }
  startGarden(state, state.seed + state.garden * 977 + state.totalScore);
}

export function skipReward(state: GardenState): void {
  if (state.phase !== "reward") {
    return;
  }
  state.garden += 1;
  if (state.garden > state.maxGardens) {
    state.phase = "won";
    state.message = `Run complete. Final score: ${state.totalScore}.`;
    return;
  }
  startGarden(state, state.seed + state.garden * 977 + state.totalScore);
}

export function restartRun(state: GardenState): GardenState {
  return createGardenState(state.seed + 101);
}

export function tileAt(state: GardenState, x: number, y: number): GlyphTile | null {
  if (!inside(state, x, y)) {
    return null;
  }
  return state.board[indexFor(state, x, y)];
}

export function neighbors(state: GardenState, tile: GridPoint, diagonal = false): GlyphTile[] {
  const steps = diagonal
    ? [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1]
      ]
    : [
        [0, -1],
        [-1, 0],
        [1, 0],
        [0, 1]
      ];
  return steps
    .map(([dx, dy]) => tileAt(state, tile.x + dx, tile.y + dy))
    .filter((candidate): candidate is GlyphTile => candidate !== null);
}

function startGarden(state: GardenState, seed: number): void {
  state.phase = "playing";
  state.turn = 1;
  state.maxTurns = BASE_TURNS + (hasRune(state, "extraTurn") ? 1 : 0);
  state.gardenScore = 0;
  state.bestChain = 0;
  state.board = Array.from({ length: state.width * state.height }, () => null);
  state.rules = pickRules(seed, state.garden);
  state.goals = createGoals(state, seed + 313);
  state.candidates = [drawCandidate(state), drawCandidate(state), drawCandidate(state)];
  state.selectedSlot = 0;
  state.rewardChoices = [];
  state.lastPlacement = null;

  if (hasRune(state, "springWell")) {
    const center = Math.floor(state.width / 2);
    setTile(state, {
      id: state.nextEntityId++,
      kind: "water",
      color: "blue",
      x: center,
      y: center,
      score: 0,
      amplified: false,
      justChanged: true
    });
  }

  updateGoals(state);
  state.message = `Garden ${state.garden}/${state.maxGardens}: satisfy ${requiredGoalCount(state)} goals to continue.`;
}

function resolvePlacement(state: GardenState, placed: GlyphTile): { kind: GlyphKind; x: number; y: number; score: number; chain: number; changed: GlyphKind[] } {
  const changed = new Set<GlyphKind>([placed.kind]);
  let chain = 1;
  let score = scoreTile(state, placed);

  if (placed.kind === "water") {
    for (const seed of neighbors(state, placed).filter((tile) => tile.kind === "seed")) {
      seed.kind = "bloom";
      seed.score += 3;
      seed.justChanged = true;
      changed.add("bloom");
      chain += 1;
      score += hasRule(state, "rain") ? 7 : 5;
    }
  }

  if (placed.kind === "stone") {
    const targets = neighbors(state, placed, hasRune(state, "stoneHeart"));
    for (const target of targets) {
      target.amplified = true;
      target.score += hasRule(state, "oldStone") ? 4 : 3;
      target.justChanged = true;
      changed.add(target.kind);
      chain += 1;
      score += hasRule(state, "oldStone") ? 4 : 3;
    }
  }

  if (placed.kind === "prism") {
    const diagonalTiles = neighbors(state, placed, true).filter((tile) => Math.abs(tile.x - placed.x) === 1 && Math.abs(tile.y - placed.y) === 1);
    const source = highestScoreTile(diagonalTiles);
    if (source) {
      placed.color = source.color;
      placed.score += hasRule(state, "crystal") ? 4 : 2;
      changed.add("prism");
      chain += 1;
      score += colorLineBonus(state, placed, hasRune(state, "prismLens") ? 2 : 1);
    }
  }

  if (placed.kind === "moth" && hasRule(state, "night") && !hasRule(state, "quietMoths")) {
    moveMothTowardBestTile(state, placed);
    chain += 1;
  }

  score += bloomRowBonuses(state);
  score += sameColorClusterBonus(state, placed);
  if (placed.amplified) {
    score += 4;
  }
  placed.score += score;

  return { kind: placed.kind, x: placed.x, y: placed.y, score, chain, changed: Array.from(changed) };
}

function scoreTile(state: GardenState, tile: GlyphTile): number {
  if (tile.kind === "seed") {
    if (hasRule(state, "dry") && !neighbors(state, tile).some((neighbor) => neighbor.kind === "water")) {
      return 0;
    }
    return 4;
  }
  if (tile.kind === "water") {
    return hasRule(state, "rain") ? 8 : 6;
  }
  if (tile.kind === "bloom") {
    return 8;
  }
  if (tile.kind === "stone") {
    return (hasRule(state, "oldStone") ? 2 : 4) + (hasRune(state, "stoneHeart") ? 1 : 0);
  }
  if (tile.kind === "moth") {
    const bloomBonus = neighbors(state, tile).filter((neighbor) => neighbor.kind === "bloom").length * (hasRule(state, "quietMoths") ? 3 : 1);
    return 5 + bloomBonus + (hasRule(state, "night") ? 4 : 0) + (hasRune(state, "moonLamp") ? 2 : 0);
  }
  return 5;
}

function bloomRowBonuses(state: GardenState): number {
  let bonus = 0;
  for (let y = 0; y < state.height; y += 1) {
    const blooms = row(state, y).filter((tile) => tile?.kind === "bloom").length;
    if (blooms >= 3) {
      bonus += hasRule(state, "wildRows") ? blooms * 3 : blooms * 2;
    }
  }
  return bonus;
}

function sameColorClusterBonus(state: GardenState, placed: GlyphTile): number {
  const matches = neighbors(state, placed, true).filter((neighbor) => neighbor.color === placed.color).length;
  return matches >= 2 ? matches * 2 : 0;
}

function colorLineBonus(state: GardenState, tile: GlyphTile, multiplier: number): number {
  const matches = row(state, tile.y).filter((candidate) => candidate?.color === tile.color).length;
  return matches * multiplier;
}

function moveMothTowardBestTile(state: GardenState, moth: GlyphTile): void {
  const best = highestScoreTile(state.board.filter((tile): tile is GlyphTile => tile !== null && tile.id !== moth.id));
  if (!best) {
    return;
  }
  const next: GridPoint = {
    x: moth.x + Math.sign(best.x - moth.x),
    y: moth.y + Math.sign(best.y - moth.y)
  };
  if (!inside(state, next.x, next.y) || tileAt(state, next.x, next.y)) {
    return;
  }
  state.board[indexFor(state, moth.x, moth.y)] = null;
  moth.x = next.x;
  moth.y = next.y;
  setTile(state, moth);
}

function finishGarden(state: GardenState): void {
  updateGoals(state);
  const achieved = state.goals.filter((goal) => goal.achieved).length;
  if (achieved < requiredGoalCount(state)) {
    state.phase = "lost";
    state.message = `The garden faded with ${achieved}/${requiredGoalCount(state)} required goals complete. Final score: ${state.totalScore}.`;
    return;
  }
  if (state.garden >= state.maxGardens) {
    state.phase = "won";
    state.message = `Run complete. Final score: ${state.totalScore}.`;
    return;
  }
  state.phase = "reward";
  state.rewardChoices = pickRuneChoices(state);
  state.message = `${achieved}/3 goals complete. Choose a rune for the next garden.`;
}

function updateGoals(state: GardenState): void {
  const counts = countKinds(state);
  const empty = state.board.filter((tile) => !tile).length;
  const wateredSeeds = state.board.filter((tile) => tile?.kind === "seed" && neighbors(state, tile).some((neighbor) => neighbor.kind === "water")).length;
  for (const goal of state.goals) {
    if (goal.id === "score") goal.progress = state.gardenScore;
    if (goal.id === "blooms") goal.progress = counts.bloom;
    if (goal.id === "chain") goal.progress = state.bestChain;
    if (goal.id === "stones") goal.progress = state.board.filter((tile) => tile?.amplified).length;
    if (goal.id === "empty") goal.progress = state.width * state.height - empty;
    if (goal.id === "moths") goal.progress = counts.moth * (hasRune(state, "moonLamp") ? 2 : 1);
    if (goal.id === "prisms") goal.progress = counts.prism;
    if (goal.id === "watered") goal.progress = wateredSeeds;
    goal.achieved = goal.progress >= goal.target;
  }
}

function createGoals(state: GardenState, seed: number): Goal[] {
  const scale = state.garden;
  const options: Goal[] = [
    makeGoal("score", "Score this garden", 46 + scale * 18),
    makeGoal("blooms", "Grow Blooms", 3 + scale),
    makeGoal("chain", "Best single reaction chain", 3 + Math.floor(scale / 2)),
    makeGoal("stones", "Amplified glyphs", 3 + scale),
    makeGoal("empty", "Filled plots", 8 + scale * 2),
    makeGoal("moths", "Moth presence", 2 + Math.floor(scale / 2)),
    makeGoal("prisms", "Prism placements", 2 + Math.floor(scale / 2)),
    makeGoal("watered", "Watered Seeds", 2 + Math.floor(scale / 2))
  ];
  return shuffle(options, seed).slice(0, 3);
}

function makeGoal(id: GoalId, label: string, target: number): Goal {
  return { id, label, target, progress: 0, achieved: false };
}

function pickRules(seed: number, garden: number): WorldRule[] {
  const count = garden >= 4 ? 3 : 2;
  return shuffle(Object.values(ruleBook), seed).slice(0, count);
}

function pickRuneChoices(state: GardenState): Rune[] {
  const available = Object.values(runeBook).filter((rune) => !state.runes.some((owned) => owned.id === rune.id));
  return shuffle(available, state.seed + state.garden * 431 + state.totalScore).slice(0, 3);
}

function drawCandidate(state: GardenState): CandidateTile {
  const roll = random(state.seed + state.nextEntityId * 37 + state.turn * 19 + state.garden * 101);
  const kindBias = buildCandidatePool(state, roll);
  const kind = kindBias[Math.floor(roll * kindBias.length) % kindBias.length];
  const color = COLOR_POOL[Math.floor(random(state.seed + state.nextEntityId * 53) * COLOR_POOL.length)];
  return { id: state.nextEntityId++, kind, color };
}

function buildCandidatePool(state: GardenState, roll: number): GlyphKind[] {
  const pool = state.garden >= 3 ? [...KIND_POOL] : KIND_POOL.filter((kind) => kind !== "prism" || roll > 0.35);
  const openGoals = state.goals.filter((goal) => !goal.achieved).map((goal) => goal.id);
  if (openGoals.includes("blooms")) {
    pool.push("seed", "water", "bloom");
  }
  if (openGoals.includes("stones")) {
    pool.push("stone", "stone");
  }
  if (openGoals.includes("moths")) {
    pool.push("moth", "moth");
  }
  if (openGoals.includes("prisms") && state.garden >= 2) {
    pool.push("prism", "prism");
  }
  if (openGoals.includes("watered")) {
    pool.push("seed", "water", "water");
  }
  if (openGoals.includes("chain")) {
    pool.push("water", "stone", "prism");
  }
  return pool;
}

function countKinds(state: GardenState): Record<GlyphKind, number> {
  const counts: Record<GlyphKind, number> = { seed: 0, water: 0, bloom: 0, stone: 0, moth: 0, prism: 0 };
  for (const tile of state.board) {
    if (tile) counts[tile.kind] += 1;
  }
  return counts;
}

function requiredGoalCount(state: GardenState): number {
  return hasRune(state, "goalSwap") && state.garden <= 2 ? 1 : 2;
}

function setTile(state: GardenState, tile: GlyphTile): void {
  state.board[indexFor(state, tile.x, tile.y)] = tile;
}

function row(state: GardenState, y: number): Array<GlyphTile | null> {
  return Array.from({ length: state.width }, (_, x) => tileAt(state, x, y));
}

function inside(state: GardenState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.width && y < state.height;
}

function indexFor(state: GardenState, x: number, y: number): number {
  return y * state.width + x;
}

function clearChangeFlags(state: GardenState): void {
  for (const tile of state.board) {
    if (tile) {
      tile.justChanged = false;
    }
  }
}

function hasRule(state: GardenState, id: RuleId): boolean {
  return state.rules.some((rule) => rule.id === id);
}

function hasRune(state: GardenState, id: RuneId): boolean {
  return state.runes.some((rune) => rune.id === id);
}

function highestScoreTile(tiles: GlyphTile[]): GlyphTile | null {
  return tiles.reduce<GlyphTile | null>((best, tile) => (!best || tile.score > best.score ? tile : best), null);
}

function shuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random(seed + index * 7919) * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function random(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function labelForGlyph(kind: GlyphKind): string {
  if (kind === "seed") return "Seed";
  if (kind === "water") return "Water";
  if (kind === "bloom") return "Bloom";
  if (kind === "stone") return "Stone";
  if (kind === "moth") return "Moth";
  return "Prism";
}
