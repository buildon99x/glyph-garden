import Phaser from "phaser";
import type { HudApi } from "../../ui/hud";
import type { CandidateSlot } from "../../game/input/actions";
import type { CandidateTile, GardenState, GlyphColor, GlyphKind, GlyphTile, GridPoint, RuneId } from "../../game/simulation/state";
import {
  chooseRune,
  createGardenState,
  labelForGlyph,
  placeSelectedCandidate,
  restartRun,
  selectCandidate,
  skipReward,
  tileAt
} from "../../game/simulation/systems/gardenSystem";

const TILE = 72;
const ORIGIN_X = 226;
const ORIGIN_Y = 98;

export class GardenScene extends Phaser.Scene {
  private state: GardenState = createGardenState();
  private readonly hud: HudApi;
  private boardLayer!: Phaser.GameObjects.Layer;
  private glyphLayer!: Phaser.GameObjects.Layer;
  private previewLayer!: Phaser.GameObjects.Layer;
  private fxLayer!: Phaser.GameObjects.Layer;
  private cells = new Map<string, Phaser.GameObjects.Rectangle>();
  private hoverCell: GridPoint | null = null;

  constructor(hud: HudApi) {
    super("garden");
    this.hud = hud;
  }

  create(): void {
    this.boardLayer = this.add.layer();
    this.glyphLayer = this.add.layer();
    this.previewLayer = this.add.layer();
    this.fxLayer = this.add.layer();
    this.drawBackdrop();
    this.drawBoard();
    this.bindInput();
    this.hud.mount({
      onCandidate: (slot) => this.chooseCandidate(slot),
      onRune: (rune) => this.takeRune(rune),
      onContinue: () => {
        skipReward(this.state);
        this.render();
      },
      onRestart: () => {
        this.state = restartRun(this.state);
        this.render();
      }
    });
    this.render();
  }

  update(): void {
    this.renderCells();
    this.renderHoverPreview();
  }

  private bindInput(): void {
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.hoverCell = this.pointerToCell(pointer);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const cell = this.pointerToCell(pointer);
      if (!cell) {
        return;
      }
      const previousPlacement = this.state.lastPlacement;
      placeSelectedCandidate(this.state, cell.x, cell.y);
      this.pulseCell(cell.x, cell.y);
      if (this.state.lastPlacement !== previousPlacement) {
        this.floatLastScore();
      }
      this.render();
    });

    const keyMap: Array<[string, CandidateSlot]> = [
      ["ONE", 0],
      ["TWO", 1],
      ["THREE", 2]
    ];
    for (const [key, slot] of keyMap) {
      this.input.keyboard?.addKey(key).on("down", () => this.chooseCandidate(slot));
    }
    this.input.keyboard?.addKey("R").on("down", () => {
      this.state = restartRun(this.state);
      this.render();
    });
  }

  private chooseCandidate(slot: CandidateSlot): void {
    selectCandidate(this.state, slot);
    this.render();
  }

  private takeRune(rune: RuneId): void {
    chooseRune(this.state, rune);
    this.render();
  }

  private drawBackdrop(): void {
    const background = this.add.graphics();
    background.fillStyle(0x141718, 1);
    background.fillRect(0, 0, 960, 640);
    background.fillStyle(0x1f2a2a, 1);
    background.fillRoundedRect(184, 56, 484, 484, 8);
    background.fillStyle(0x111716, 1);
    background.fillRoundedRect(200, 72, 452, 452, 6);
    background.fillStyle(0x263535, 1);
    background.fillRoundedRect(214, 86, 424, 424, 6);
    this.boardLayer.add(background);

    const title = this.add.text(226, 552, "Build reactions. Complete 2 of 3 goals. Survive five gardens.", {
      color: "#b8cfc3",
      fontFamily: "monospace",
      fontSize: "14px"
    });
    this.boardLayer.add(title);
  }

  private drawBoard(): void {
    for (let y = 0; y < this.state.height; y += 1) {
      for (let x = 0; x < this.state.width; x += 1) {
        const point = cellToWorld(x, y);
        const rect = this.add.rectangle(point.x, point.y, TILE - 8, TILE - 8, tileColor(x, y), 1);
        rect.setStrokeStyle(1, 0x58706b, 0.5);
        this.boardLayer.add(rect);
        this.cells.set(keyFor(x, y), rect);
      }
    }
  }

  private render(): void {
    this.hud.render(this.state);
    this.renderCells();
    this.renderGlyphs();
  }

  private renderCells(): void {
    for (const [key, rect] of this.cells) {
      const [x, y] = key.split(":").map(Number);
      const tile = tileAt(this.state, x, y);
      rect.setFillStyle(tile ? occupiedTileColor(tile.color) : tileColor(x, y), tile ? 0.96 : 1);
      rect.setStrokeStyle(1, tile?.amplified ? 0xffd166 : 0x58706b, tile?.amplified ? 1 : 0.5);
    }
    if (this.hoverCell && this.state.phase === "playing") {
      this.highlightPredictedReactions();
      const rect = this.cells.get(keyFor(this.hoverCell.x, this.hoverCell.y));
      rect?.setStrokeStyle(3, tileAt(this.state, this.hoverCell.x, this.hoverCell.y) ? 0xff7566 : 0xf7d36a, 1);
    }
  }

  private highlightPredictedReactions(): void {
    if (!this.hoverCell || tileAt(this.state, this.hoverCell.x, this.hoverCell.y)) {
      return;
    }
    const candidate = this.state.candidates[this.state.selectedSlot];
    const affected = affectedCellsFor(candidate, this.hoverCell, this.state);
    for (const point of affected) {
      const rect = this.cells.get(keyFor(point.x, point.y));
      rect?.setStrokeStyle(3, candidate.kind === "water" ? 0x72c7e8 : 0xffd166, 0.95);
    }
  }

  private renderGlyphs(): void {
    this.glyphLayer.getChildren().forEach((child) => child.destroy());
    for (const tile of this.state.board) {
      if (tile) {
        this.drawGlyph(tile);
      }
    }
  }

  private renderHoverPreview(): void {
    this.previewLayer.getChildren().forEach((child) => child.destroy());
    if (!this.hoverCell || this.state.phase !== "playing") {
      return;
    }
    const candidate = this.state.candidates[this.state.selectedSlot];
    if (!candidate || tileAt(this.state, this.hoverCell.x, this.hoverCell.y)) {
      return;
    }
    const point = cellToWorld(this.hoverCell.x, this.hoverCell.y);
    const ghost = this.add.graphics();
    ghost.setAlpha(0.46);
    ghost.fillStyle(colorValue(candidate.color), 1);
    ghost.lineStyle(3, 0xfff0c2, 0.9);
    drawGlyphShape(ghost, candidate.kind, point.x, point.y);
    this.previewLayer.add(ghost);
  }

  private drawGlyph(tile: GlyphTile): void {
    const point = cellToWorld(tile.x, tile.y);
    const graphics = this.add.graphics();
    graphics.setData("dynamic", true);
    graphics.fillStyle(0x0f1415, 0.36);
    graphics.fillCircle(point.x + 3, point.y + 5, 25);
    graphics.fillStyle(colorValue(tile.color), 0.95);
    graphics.lineStyle(tile.justChanged ? 4 : 2, tile.justChanged ? 0xffffff : 0x152020, tile.justChanged ? 0.95 : 0.85);
    drawGlyphShape(graphics, tile.kind, point.x, point.y);
    if (tile.amplified) {
      graphics.lineStyle(3, 0xffd166, 0.9);
      graphics.strokeCircle(point.x, point.y, 29);
    }
    this.glyphLayer.add(graphics);

    const label = this.add.text(point.x, point.y + 25, labelForGlyph(tile.kind), {
      color: "#f8f0df",
      fontFamily: "monospace",
      fontSize: "10px"
    });
    label.setOrigin(0.5);
    this.glyphLayer.add(label);
  }

  private pulseCell(x: number, y: number): void {
    if (this.state.phase !== "playing" && this.state.phase !== "reward") {
      return;
    }
    const point = cellToWorld(x, y);
    const ring = this.add.circle(point.x, point.y, 8, 0xffffff, 0);
    ring.setStrokeStyle(3, 0xffe0a1, 0.9);
    this.fxLayer.add(ring);
    this.tweens.add({
      targets: ring,
      radius: 42,
      alpha: 0,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => ring.destroy()
    });
  }

  private floatLastScore(): void {
    const placement = this.state.lastPlacement;
    if (!placement) {
      return;
    }
    const point = cellToWorld(placement.x, placement.y);
    const text = this.add.text(point.x, point.y - 34, `+${placement.score}`, {
      color: "#fff2bf",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#101414",
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    this.fxLayer.add(text);
    this.tweens.add({
      targets: text,
      y: point.y - 58,
      alpha: 0,
      duration: 760,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }

  private pointerToCell(pointer: Phaser.Input.Pointer): GridPoint | null {
    const x = Math.floor((pointer.x - ORIGIN_X + TILE / 2) / TILE);
    const y = Math.floor((pointer.y - ORIGIN_Y + TILE / 2) / TILE);
    if (x < 0 || y < 0 || x >= this.state.width || y >= this.state.height) {
      return null;
    }
    return { x, y };
  }
}

function affectedCellsFor(candidate: CandidateTile, origin: GridPoint, state: GardenState): GridPoint[] {
  if (candidate.kind === "water") {
    return orthogonal(origin)
      .filter((point) => tileAt(state, point.x, point.y)?.kind === "seed");
  }
  if (candidate.kind === "stone") {
    return orthogonal(origin).filter((point) => tileAt(state, point.x, point.y));
  }
  if (candidate.kind === "prism") {
    return diagonal(origin).filter((point) => tileAt(state, point.x, point.y));
  }
  return [];
}

function orthogonal(origin: GridPoint): GridPoint[] {
  return [
    { x: origin.x, y: origin.y - 1 },
    { x: origin.x - 1, y: origin.y },
    { x: origin.x + 1, y: origin.y },
    { x: origin.x, y: origin.y + 1 }
  ];
}

function diagonal(origin: GridPoint): GridPoint[] {
  return [
    { x: origin.x - 1, y: origin.y - 1 },
    { x: origin.x + 1, y: origin.y - 1 },
    { x: origin.x - 1, y: origin.y + 1 },
    { x: origin.x + 1, y: origin.y + 1 }
  ];
}

function drawGlyphShape(graphics: Phaser.GameObjects.Graphics, kind: GlyphKind, x: number, y: number): void {
  if (kind === "seed") {
    graphics.fillEllipse(x - 8, y, 20, 32);
    graphics.strokeEllipse(x - 8, y, 20, 32);
    graphics.fillEllipse(x + 10, y - 4, 20, 28);
    graphics.strokeEllipse(x + 10, y - 4, 20, 28);
    return;
  }
  if (kind === "water") {
    graphics.fillTriangle(x, y - 28, x - 22, y + 6, x + 22, y + 6);
    graphics.strokeTriangle(x, y - 28, x - 22, y + 6, x + 22, y + 6);
    graphics.fillCircle(x, y + 6, 22);
    graphics.strokeCircle(x, y + 6, 22);
    return;
  }
  if (kind === "bloom") {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      graphics.fillEllipse(x + Math.cos(angle) * 13, y + Math.sin(angle) * 13, 18, 28, angle);
      graphics.strokeEllipse(x + Math.cos(angle) * 13, y + Math.sin(angle) * 13, 18, 28);
    }
    graphics.fillStyle(0xfff1a8, 1);
    graphics.fillCircle(x, y, 8);
    return;
  }
  if (kind === "stone") {
    graphics.fillRoundedRect(x - 23, y - 22, 46, 44, 8);
    graphics.strokeRoundedRect(x - 23, y - 22, 46, 44, 8);
    graphics.lineStyle(2, 0xffffff, 0.35);
    graphics.lineBetween(x - 12, y - 6, x + 14, y - 12);
    graphics.lineBetween(x - 8, y + 12, x + 17, y + 7);
    return;
  }
  if (kind === "moth") {
    graphics.fillEllipse(x - 14, y, 24, 40, -0.5);
    graphics.strokeEllipse(x - 14, y, 24, 40);
    graphics.fillEllipse(x + 14, y, 24, 40, 0.5);
    graphics.strokeEllipse(x + 14, y, 24, 40);
    graphics.fillStyle(0x1b1924, 1);
    graphics.fillRoundedRect(x - 4, y - 18, 8, 36, 4);
    return;
  }
  graphics.beginPath();
  graphics.moveTo(x, y - 29);
  graphics.lineTo(x + 26, y);
  graphics.lineTo(x, y + 29);
  graphics.lineTo(x - 26, y);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
  graphics.lineStyle(2, 0xffffff, 0.5);
  graphics.lineBetween(x - 14, y, x + 14, y);
  graphics.lineBetween(x, y - 16, x, y + 16);
}

function cellToWorld(x: number, y: number): GridPoint {
  return {
    x: ORIGIN_X + x * TILE,
    y: ORIGIN_Y + y * TILE
  };
}

function keyFor(x: number, y: number): string {
  return `${x}:${y}`;
}

function tileColor(x: number, y: number): number {
  return (x + y) % 2 === 0 ? 0x344541 : 0x2d3c39;
}

function occupiedTileColor(color: GlyphColor): number {
  if (color === "green") return 0x2f5c46;
  if (color === "blue") return 0x2e5365;
  if (color === "gold") return 0x665329;
  return 0x51466d;
}

function colorValue(color: GlyphColor): number {
  if (color === "green") return 0x80d89a;
  if (color === "blue") return 0x72c7e8;
  if (color === "gold") return 0xffd166;
  return 0xc9a4ff;
}
