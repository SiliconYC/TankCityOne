import { Game } from "./engine/game.js";
import { levels } from "./data/levels.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game-root");
  const overlay = document.querySelector("[data-ui='overlay']");
  const overlayTitle = overlay.querySelector("[data-ui='overlay-title']");
  const overlayBody = overlay.querySelector("[data-ui='overlay-body']");
  const overlayButton = overlay.querySelector("[data-ui='overlay-button']");

  const ui = {
    overlay,
    overlayTitle,
    overlayBody,
    overlayButton,
    lives: document.querySelector("[data-ui='lives']"),
    score: document.querySelector("[data-ui='score']"),
    enemies: document.querySelector("[data-ui='enemies']"),
    stage: document.querySelector("[data-ui='stage']"),
    levelName: document.querySelector("[data-ui='level-name']"),
    fps: document.querySelector("[data-ui='fps']"),
  };

  const game = new Game({ root, levels, ui });
  game.init();

  overlayButton.addEventListener("click", () => {
    game.handleOverlayConfirm();
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Enter" && !ui.overlay.hidden) {
      event.preventDefault();
      game.handleOverlayConfirm();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      game.pause();
    }
  });
});
