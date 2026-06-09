import type { CandidateSlot } from "../input/actions";

export type Phase = "playing" | "reward" | "won" | "lost";
export type GlyphKind = "seed" | "water" | "bloom" | "stone" | "moth" | "prism";
export type RuleId = "rain" | "night" | "dry" | "crystal" | "oldStone" | "wildRows" | "quietMoths";
export type GoalId = "score" | "blooms" | "chain" | "stones" | "empty" | "moths" | "prisms" | "watered";
export type RuneId = "springWell" | "stoneHeart" | "moonLamp" | "prismLens" | "extraTurn" | "goalSwap";

export interface GridPoint {
  x: number;
  y: number;
}

export interface GlyphTile extends GridPoint {
  id: number;
  kind: GlyphKind;
  color: GlyphColor;
  score: number;
  amplified: boolean;
  justChanged: boolean;
}

export type GlyphColor = "green" | "blue" | "gold" | "violet";

export interface CandidateTile {
  id: number;
  kind: GlyphKind;
  color: GlyphColor;
}

export interface WorldRule {
  id: RuleId;
  name: string;
  text: string;
}

export interface Goal {
  id: GoalId;
  label: string;
  target: number;
  progress: number;
  achieved: boolean;
}

export interface Rune {
  id: RuneId;
  name: string;
  text: string;
}

export interface PlacementRecord {
  kind: GlyphKind;
  x: number;
  y: number;
  score: number;
  chain: number;
  changed: GlyphKind[];
}

export interface GardenState {
  width: number;
  height: number;
  phase: Phase;
  garden: number;
  maxGardens: number;
  turn: number;
  maxTurns: number;
  totalScore: number;
  gardenScore: number;
  bestChain: number;
  selectedSlot: CandidateSlot;
  board: Array<GlyphTile | null>;
  candidates: CandidateTile[];
  rules: WorldRule[];
  goals: Goal[];
  runes: Rune[];
  rewardChoices: Rune[];
  message: string;
  lastPlacement: PlacementRecord | null;
  nextEntityId: number;
  seed: number;
}
