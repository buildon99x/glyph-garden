import Phaser from "phaser";
import { GardenScene } from "./phaser/scenes/GardenScene";
import { createHud } from "./ui/hud";
import "./styles.css";

const hud = createHud(document.getElementById("hud-root")!);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: 960,
  height: 640,
  backgroundColor: "#18202a",
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [new GardenScene(hud)]
};

new Phaser.Game(config);
