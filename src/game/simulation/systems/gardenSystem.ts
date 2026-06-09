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
  RunMode,
  Unlock,
  UnlockId,
  RuleId,
  WorldRule
} from "../state";

const BOARD_SIZE = 6;
const RUN_LENGTH = 5;
const BASE_TURNS = 12;
const LOW_STONE_SCORE = 2;
const KIND_POOL: GlyphKind[] = ["seed", "water", "bloom", "stone", "moth", "prism"];
const COLOR_POOL: GlyphColor[] = ["green", "blue", "gold", "violet"];

const ruleBook: Record<RuleId, WorldRule> = {
  rain: { id: "rain", name: "비 오는 정원", text: "물 반응이 +1 강해지고 씨앗을 더 크게 성장시킵니다." },
  night: { id: "night", name: "밤의 정원", text: "나방이 +4점을 얻고 턴 끝에 두 칸까지 이동합니다." },
  dry: { id: "dry", name: "메마른 흙", text: "씨앗은 인접한 물이 없으면 0점입니다." },
  crystal: { id: "crystal", name: "수정 계절", text: "프리즘이 복사한 색 보너스를 즉시 발동합니다." },
  oldStone: { id: "oldStone", name: "오래된 돌", text: "돌의 증폭은 강해지지만 돌 자체 점수는 낮아집니다." },
  wildRows: { id: "wildRows", name: "야생의 줄기", text: "꽃이 3개 이상 있는 줄은 더 큰 조화 보너스를 줍니다." },
  quietMoths: { id: "quietMoths", name: "고요한 나방", text: "나방은 움직이지 않지만 인접한 꽃마다 +3점을 얻습니다." }
};

const runeBook: Record<RuneId, Rune> = {
  springWell: { id: "springWell", name: "샘의 우물", text: "새 정원마다 중앙에 물 타일 하나로 시작합니다." },
  stoneHeart: { id: "stoneHeart", name: "돌의 심장", text: "돌 기본 점수 +3, 직선과 대각선 이웃을 모두 증폭합니다." },
  moonLamp: { id: "moonLamp", name: "달빛 등불", text: "나방이 +2점을 얻고 나방 목표에서 2배로 계산됩니다." },
  prismLens: { id: "prismLens", name: "프리즘 렌즈", text: "프리즘은 같은 줄의 동일 색 타일마다 +2점을 얻습니다." },
  extraTurn: { id: "extraTurn", name: "느긋한 계절", text: "각 정원에 턴이 1개 추가됩니다." },
  goalSwap: { id: "goalSwap", name: "유연한 맹세", text: "1, 2번째 정원에서는 목표 1개만 달성해도 계속 진행합니다." },
  waterSigil: { id: "waterSigil", name: "물의 인장", text: "새 후보 묶음마다 물 문양이 최소 1개 포함됩니다." },
  clearingCharm: { id: "clearingCharm", name: "개간 부적", text: "새 정원마다 빈칸 하나를 꽃으로 채우고 +10점을 얻습니다." }
};

const unlockBook: Record<UnlockId, Unlock> = {
  wildRules: { id: "wildRules", name: "변칙 계절", text: "새 런에서 고급 세계 규칙이 등장합니다." },
  startingRune: { id: "startingRune", name: "시작 룬", text: "새 런을 물의 인장 룬과 함께 시작합니다." },
  expandedPool: { id: "expandedPool", name: "확장 문양풀", text: "초반 정원 후보에도 나방과 프리즘이 더 자주 등장합니다." },
  hardGoals: { id: "hardGoals", name: "고난도 목표", text: "후반 정원 목표가 더 빡빡해지고 보상이 다양해집니다." },
  boardVariants: { id: "boardVariants", name: "변형 정원", text: "새 정원의 시작 보드 구성이 더 다양해집니다." }
};

export interface GardenStateOptions {
  mode?: RunMode;
  unlockIds?: UnlockId[];
}

export function createGardenState(seed = Date.now() % 100000, options: GardenStateOptions = {}): GardenState {
  const state: GardenState = {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    phase: "playing",
    mode: options.mode ?? "standard",
    garden: 1,
    maxGardens: RUN_LENGTH,
    turn: 1,
    maxTurns: BASE_TURNS,
    totalScore: 0,
    gardenScore: 0,
    bestChain: 0,
    wateredSeeds: 0,
    selectedSlot: 0,
    board: Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null),
    candidates: [],
    rules: [],
    goals: [],
    runes: startingRunesFor(options.unlockIds ?? []),
    unlocks: (options.unlockIds ?? []).map((id) => unlockBook[id]),
    newUnlock: null,
    rewardChoices: [],
    message: "문양을 고르고 배치해 계절이 끝나기 전에 점수 엔진을 만드세요.",
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
    state.message = "이미 문양이 있는 칸입니다.";
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
  ensureWaterCandidate(state);
  updateGoals(state);

  const changedText = result.changed.length > 1 ? ` ${result.changed.map(labelForGlyph).join(", ")} 반응.` : "";
  state.message = `${labelForGlyph(tile.kind)} ${result.score}점. 연쇄 ${result.chain}.${changedText}`;

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
    state.newUnlock = nextUnlock(state);
    state.message = `런 완료. 최종 점수: ${state.totalScore}.`;
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
    state.newUnlock = nextUnlock(state);
    state.message = `런 완료. 최종 점수: ${state.totalScore}.`;
    return;
  }
  startGarden(state, state.seed + state.garden * 977 + state.totalScore);
}

export function restartRun(state: GardenState): GardenState {
  const seed = state.mode === "daily" ? state.seed : state.seed + 101;
  return createGardenState(seed, { mode: state.mode, unlockIds: state.unlocks.map((unlock) => unlock.id) });
}

export function createDailyGardenState(unlockIds: UnlockId[] = [], date = new Date()): GardenState {
  return createGardenState(dailySeed(date), { mode: "daily", unlockIds });
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
  state.wateredSeeds = 0;
  state.board = Array.from({ length: state.width * state.height }, () => null);
  state.rules = pickRules(seed, state.garden, hasUnlock(state, "wildRules"));
  state.goals = createGoals(state, seed + 313);
  state.selectedSlot = 0;
  state.rewardChoices = [];
  state.lastPlacement = null;
  state.newUnlock = null;
  seedInitialBoard(state, seed + 157);

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

  if (hasRune(state, "clearingCharm")) {
    fillBonusPlot(state, seed + 619);
    state.gardenScore += 10;
    state.totalScore += 10;
  }

  state.candidates = [drawCandidate(state), drawCandidate(state), drawCandidate(state)];
  ensureWaterCandidate(state);
  updateGoals(state);
  const modeLabel = state.mode === "daily" ? "데일리 " : "";
  state.message = `${modeLabel}정원 ${state.garden}/${state.maxGardens}: 계속하려면 목표 ${requiredGoalCount(state)}개를 달성하세요.`;
}

function seedInitialBoard(state: GardenState, seed: number): void {
  const variance = hasUnlock(state, "boardVariants") ? Math.floor(random(seed + 43) * 3) : 0;
  const startingTiles = Math.min(6 + state.garden + variance, Math.floor(state.width * state.height * 0.34));
  const anchorKinds: GlyphKind[] = ["seed", "water", "bloom", "stone", "moth", "prism"];
  const points = shuffle(
    Array.from({ length: state.width * state.height }, (_, index) => ({
      x: index % state.width,
      y: Math.floor(index / state.width)
    })),
    seed
  );

  for (let index = 0; index < startingTiles; index += 1) {
    const point = points[index];
    const kind = anchorKinds[index % anchorKinds.length];
    setTile(state, {
      id: state.nextEntityId++,
      kind,
      color: COLOR_POOL[Math.floor(random(seed + index * 127) * COLOR_POOL.length)],
      x: point.x,
      y: point.y,
      score: baseInitialScore(kind),
      amplified: false,
      justChanged: false
    });
  }
}

function fillBonusPlot(state: GardenState, seed: number): void {
  const open = state.board
    .map((tile, index) => ({ tile, index }))
    .filter((entry) => !entry.tile);
  if (open.length === 0) {
    return;
  }
  const chosen = open[Math.floor(random(seed) * open.length)];
  state.board[chosen.index] = {
    id: state.nextEntityId++,
    kind: "bloom",
    color: "green",
    x: chosen.index % state.width,
    y: Math.floor(chosen.index / state.width),
    score: 8,
    amplified: false,
    justChanged: true
  };
}

function resolvePlacement(state: GardenState, placed: GlyphTile): { kind: GlyphKind; x: number; y: number; score: number; chain: number; changed: GlyphKind[] } {
  const changed = new Set<GlyphKind>([placed.kind]);
  let chain = 1;
  let score = scoreTile(state, placed);
  const power = effectPower(placed);

  if (placed.kind === "water") {
    const reaction = growAdjacentSeeds(state, placed, power);
    score += reaction.score;
    chain += reaction.chain;
    if (reaction.chain > 0) changed.add("bloom");
  }

  if (placed.kind === "stone") {
    const targets = neighbors(state, placed, hasRune(state, "stoneHeart"));
    for (const target of targets) {
      target.amplified = true;
      target.score += hasRule(state, "oldStone") ? 3 : 2;
      target.justChanged = true;
      changed.add(target.kind);
      chain += 1;
      score += hasRule(state, "oldStone") ? 3 : 2;
      const amplified = resolveAmplifiedEffect(state, target);
      score += amplified.score;
      chain += amplified.chain;
      amplified.changed.forEach((kind) => changed.add(kind));
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
      if (hasRule(state, "crystal")) {
        const copied = resolveCopiedEffect(state, placed, source);
        score += copied.score;
        chain += copied.chain;
        copied.changed.forEach((kind) => changed.add(kind));
      }
    }
  }

  score += bloomRowBonuses(state);
  score += sameColorClusterBonus(state, placed);
  const movedMoths = moveMothsAtEndOfTurn(state);
  if (movedMoths > 0) {
    chain += movedMoths;
    changed.add("moth");
  }
  placed.score += score;

  return { kind: placed.kind, x: placed.x, y: placed.y, score, chain, changed: Array.from(changed) };
}

function scoreTile(state: GardenState, tile: GlyphTile): number {
  const power = effectPower(tile);
  if (tile.kind === "seed") {
    if (hasRule(state, "dry") && !neighbors(state, tile).some((neighbor) => neighbor.kind === "water")) {
      return 0;
    }
    return (2 + neighbors(state, tile).filter((neighbor) => neighbor.kind === "water").length * 2) * power;
  }
  if (tile.kind === "water") {
    return (hasRule(state, "rain") ? 7 : 6) * power;
  }
  if (tile.kind === "bloom") {
    return 8 * power;
  }
  if (tile.kind === "stone") {
    return (LOW_STONE_SCORE + (hasRune(state, "stoneHeart") ? 3 : 0)) * power;
  }
  if (tile.kind === "moth") {
    const bloomBonus = neighbors(state, tile).filter((neighbor) => neighbor.kind === "bloom").length * (hasRule(state, "quietMoths") ? 3 : 1);
    return (5 + bloomBonus + (hasRule(state, "night") ? 4 : 0) + (hasRune(state, "moonLamp") ? 2 : 0)) * power;
  }
  return 5 * power;
}

function baseInitialScore(kind: GlyphKind): number {
  if (kind === "seed") return 2;
  if (kind === "water") return 6;
  if (kind === "bloom") return 8;
  if (kind === "stone") return LOW_STONE_SCORE;
  if (kind === "moth") return 5;
  return 5;
}

function effectPower(tile: GlyphTile): number {
  return tile.amplified ? 2 : 1;
}

function growAdjacentSeeds(state: GardenState, origin: GridPoint, power: number): { score: number; chain: number } {
  let score = 0;
  let chain = 0;
  const growthScore = (hasRule(state, "rain") ? 6 : 5) * power;
  for (const seed of neighbors(state, origin).filter((tile) => tile.kind === "seed")) {
    seed.kind = "bloom";
    seed.score += 3 * power;
    seed.justChanged = true;
    chain += 1;
    state.wateredSeeds += 1;
    score += growthScore;
  }
  return { score, chain };
}

function resolveCopiedEffect(state: GardenState, prism: GlyphTile, source: GlyphTile): { score: number; chain: number; changed: GlyphKind[] } {
  if (source.kind === "water") {
    const reaction = growAdjacentSeeds(state, prism, effectPower(source));
    return { ...reaction, changed: reaction.chain > 0 ? ["bloom"] : [] };
  }
  if (source.kind === "stone") {
    let score = 0;
    let chain = 0;
    const targets = neighbors(state, prism, hasRune(state, "stoneHeart"));
    for (const target of targets) {
      if (target.id === prism.id) continue;
      target.amplified = true;
      target.score += 2 * effectPower(source);
      target.justChanged = true;
      score += 2 * effectPower(source);
      chain += 1;
    }
    return { score, chain, changed: chain > 0 ? ["stone"] : [] };
  }
  if (source.kind === "seed") {
    return { score: neighbors(state, prism).filter((neighbor) => neighbor.kind === "water").length * 2 * effectPower(source), chain: 1, changed: ["seed"] };
  }
  if (source.kind === "moth") {
    return { score: scoreTile(state, source), chain: 1, changed: ["moth"] };
  }
  return { score: 0, chain: 0, changed: [] };
}

function resolveAmplifiedEffect(state: GardenState, tile: GlyphTile): { score: number; chain: number; changed: GlyphKind[] } {
  if (tile.kind === "water") {
    const reaction = growAdjacentSeeds(state, tile, effectPower(tile));
    return { ...reaction, changed: reaction.chain > 0 ? ["bloom"] : [] };
  }
  if (tile.kind === "seed") {
    return { score: scoreTile(state, tile), chain: 1, changed: ["seed"] };
  }
  if (tile.kind === "bloom") {
    return { score: bloomRowBonuses(state), chain: 1, changed: ["bloom"] };
  }
  if (tile.kind === "moth") {
    return { score: scoreTile(state, tile), chain: 1, changed: ["moth"] };
  }
  if (tile.kind === "prism") {
    return { score: colorLineBonus(state, tile, hasRune(state, "prismLens") ? 2 : 1), chain: 1, changed: ["prism"] };
  }
  return { score: 0, chain: 0, changed: [] };
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

function moveMothsAtEndOfTurn(state: GardenState): number {
  if (hasRule(state, "quietMoths")) {
    return 0;
  }
  let moved = 0;
  const steps = hasRule(state, "night") ? 2 : 1;
  const moths = state.board.filter((tile): tile is GlyphTile => tile?.kind === "moth");
  for (const moth of moths) {
    for (let step = 0; step < steps; step += 1) {
      if (moveMothTowardBestTile(state, moth)) {
        moved += 1;
      }
    }
  }
  return moved;
}

function moveMothTowardBestTile(state: GardenState, moth: GlyphTile): boolean {
  const best = highestScoreTile(state.board.filter((tile): tile is GlyphTile => tile !== null && tile.id !== moth.id));
  if (!best) {
    return false;
  }
  const next: GridPoint = {
    x: moth.x + Math.sign(best.x - moth.x),
    y: moth.y + Math.sign(best.y - moth.y)
  };
  if (!inside(state, next.x, next.y) || tileAt(state, next.x, next.y)) {
    return false;
  }
  state.board[indexFor(state, moth.x, moth.y)] = null;
  moth.x = next.x;
  moth.y = next.y;
  moth.justChanged = true;
  setTile(state, moth);
  return true;
}

function finishGarden(state: GardenState): void {
  updateGoals(state);
  const achieved = state.goals.filter((goal) => goal.achieved).length;
  if (achieved < requiredGoalCount(state)) {
    state.phase = "lost";
    state.message = `정원이 사라졌습니다. 필수 목표 ${achieved}/${requiredGoalCount(state)}개 달성. 최종 점수: ${state.totalScore}.`;
    return;
  }
  if (state.garden >= state.maxGardens) {
    state.phase = "won";
    state.newUnlock = nextUnlock(state);
    state.message = `런 완료. 최종 점수: ${state.totalScore}.`;
    return;
  }
  state.phase = "reward";
  state.rewardChoices = pickRuneChoices(state, achieved >= state.goals.length ? 3 : 2);
  state.message = `목표 ${achieved}/3개 달성. 다음 정원을 위한 룬을 고르세요.`;
}

function updateGoals(state: GardenState): void {
  const counts = countKinds(state);
  const empty = state.board.filter((tile) => !tile).length;
  for (const goal of state.goals) {
    if (goal.id === "score") goal.progress = state.gardenScore;
    if (goal.id === "blooms") goal.progress = counts.bloom;
    if (goal.id === "chain") goal.progress = state.bestChain;
    if (goal.id === "stones") goal.progress = state.board.filter((tile) => tile?.amplified).length;
    if (goal.id === "empty") goal.progress = state.width * state.height - empty;
    if (goal.id === "moths") goal.progress = counts.moth * (hasRune(state, "moonLamp") ? 2 : 1);
    if (goal.id === "prisms") goal.progress = counts.prism;
    if (goal.id === "watered") goal.progress = state.wateredSeeds;
    if (goal.id === "boss") goal.progress = state.bestChain;
    goal.achieved = goal.progress >= goal.target;
  }
}

function createGoals(state: GardenState, seed: number): Goal[] {
  const scale = state.garden;
  const hard = hasUnlock(state, "hardGoals") && state.garden >= 3 ? 1 : 0;
  const options: Goal[] = [
    makeGoal("score", "이번 정원 점수", 38 + scale * 16 + hard * 12),
    makeGoal("blooms", "꽃 피우기", 3 + scale + hard),
    makeGoal("chain", "최고 단일 연쇄", 3 + Math.floor(scale / 2)),
    makeGoal("stones", "증폭된 문양", 3 + scale + hard),
    makeGoal("empty", "채운 칸", 8 + scale * 2 + hard),
    makeGoal("moths", "나방 존재감", 2 + Math.floor(scale / 2)),
    makeGoal("prisms", "프리즘 배치", 1 + Math.floor(scale / 2)),
    makeGoal("watered", "물을 받은 씨앗", 1 + Math.floor(scale / 2))
  ];
  if (state.garden >= state.maxGardens) {
    return [makeGoal("boss", "마지막 정원 연쇄", 3), ...shuffle(options, seed).slice(0, 2)];
  }
  const goals = shuffle(options, seed).slice(0, 3);
  if (hasRune(state, "goalSwap") && !goals.some((goal) => goal.id === "score")) {
    goals[2] = makeGoal("score", "교체된 점수 목표", 32 + scale * 12);
  }
  return goals;
}

function makeGoal(id: GoalId, label: string, target: number): Goal {
  return { id, label, target, progress: 0, achieved: false };
}

function pickRules(seed: number, garden: number, wildRules: boolean): WorldRule[] {
  const count = garden >= 3 ? 3 : 2;
  const basicRules: RuleId[] = ["rain", "night", "dry", "crystal"];
  const rules = Object.values(ruleBook).filter((rule) => wildRules || garden >= 3 || basicRules.includes(rule.id));
  return shuffle(rules, seed).slice(0, count);
}

function pickRuneChoices(state: GardenState, count: number): Rune[] {
  const available = Object.values(runeBook).filter((rune) => !state.runes.some((owned) => owned.id === rune.id));
  return shuffle(available, state.seed + state.garden * 431 + state.totalScore).slice(0, count);
}

function drawCandidate(state: GardenState): CandidateTile {
  const roll = random(state.seed + state.nextEntityId * 37 + state.turn * 19 + state.garden * 101);
  const kindBias = buildCandidatePool(state, roll);
  const kind = kindBias[Math.floor(roll * kindBias.length) % kindBias.length];
  const color = COLOR_POOL[Math.floor(random(state.seed + state.nextEntityId * 53) * COLOR_POOL.length)];
  return { id: state.nextEntityId++, kind, color };
}

function ensureWaterCandidate(state: GardenState): void {
  if (!hasRune(state, "waterSigil") || state.candidates.some((candidate) => candidate.kind === "water")) {
    return;
  }
  state.candidates[0] = {
    id: state.nextEntityId++,
    kind: "water",
    color: "blue"
  };
}

function buildCandidatePool(state: GardenState, roll: number): GlyphKind[] {
  const pool =
    state.garden >= 3 || hasUnlock(state, "expandedPool") ? [...KIND_POOL] : KIND_POOL.filter((kind) => kind !== "prism" || roll > 0.35);
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
  if (openGoals.includes("boss")) {
    pool.push("water", "stone", "moth", "prism");
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

function hasUnlock(state: GardenState, id: UnlockId): boolean {
  return state.unlocks.some((unlock) => unlock.id === id);
}

function startingRunesFor(unlockIds: UnlockId[]): Rune[] {
  return unlockIds.includes("startingRune") ? [runeBook.waterSigil] : [];
}

function nextUnlock(state: GardenState): Unlock | null {
  if (state.mode === "daily") {
    return null;
  }
  const order: UnlockId[] = ["wildRules", "startingRune", "expandedPool", "boardVariants", "hardGoals"];
  const owned = new Set(state.unlocks.map((unlock) => unlock.id));
  const next = order.find((id) => !owned.has(id));
  return next ? unlockBook[next] : null;
}

function dailySeed(date: Date): number {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return Number(stamp) % 100000;
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
  if (kind === "seed") return "씨앗";
  if (kind === "water") return "물";
  if (kind === "bloom") return "꽃";
  if (kind === "stone") return "돌";
  if (kind === "moth") return "나방";
  return "프리즘";
}
