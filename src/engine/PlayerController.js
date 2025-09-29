// path: src/engine/PlayerController.js
import { DIRECTION_VECTORS } from "./constants.js";

export class PlayerController {
  constructor(game) {
    this.game = game;
  }

  update(delta) {
    const player = this.game.player;
    if (!player || player.isDestroyed) {
      return;
    }

    const direction = this.resolveInputDirection();
    if (direction) {
      // 无论如何，先根据输入设置坦克的朝向
      player.setDirection(direction);
      // 只有当坦克当前不处于移动状态时，才尝试开始一次新的移动
      if (!player.isMoving()) {
        this.game.tryMoveTank(player, direction);
      }
    }

    if (this.game.input.isActive("fire")) {
      this.game.tryFire(player);
    }

    player.update(delta);
  }

  resolveInputDirection() {
    const priority = ["up", "left", "down", "right"];
    for (const dir of priority) {
      if (this.game.input.isActive(dir)) {
        return dir;
      }
    }
    return null;
  }
}