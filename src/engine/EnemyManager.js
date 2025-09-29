// path: src/engine/EnemyManager.js
import { Tank } from "../entities/tank.js";
import { ENEMY_TYPES } from "../data/enemies.js";
import { DIRECTION_VECTORS } from "./constants.js";

const MAX_CONCURRENT_ENEMIES = 4;

export class EnemyManager {
  constructor(game) {
    this.game = game;
  }

  update(delta) {
    this.processSpawns();
    
    for (const enemy of this.game.activeEnemies) {
      const tank = enemy.tank;
      tank.update(delta);

      enemy.moveTimer -= delta;
      enemy.shotTimer -= delta;

      if (!tank.isMoving() && enemy.moveTimer <= 0) {
        const direction = this.pickEnemyDirection(enemy);
        if (direction) {
          this.game.tryMoveTank(tank, direction);
        }
        enemy.moveTimer = 0.6 + Math.random() * 1.2;
      }

      if (enemy.shotTimer <= 0) {
        if (this.game.tryFire(tank)) {
          enemy.shotTimer = 1.2 + Math.random() * 1.5;
        } else {
          enemy.shotTimer = 0.3;
        }
      }
    }
  }

  pickEnemyDirection(enemy) {
    const directions = ["up", "down", "left", "right"];
    const candidates = directions.filter((dir) => {
      const vector = DIRECTION_VECTORS[dir];
      const target = {
        x: enemy.tank.tile.x + vector.x,
        y: enemy.tank.tile.y + vector.y,
      };
      if (!this.game.isWithinBounds(target)) return false;
      if (!this.game.tileMap.isPassable(target.x, target.y)) return false;
      if (this.game.isTileOccupied(target.x, target.y, enemy.tank)) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    const sameDirectionIndex = candidates.indexOf(enemy.tank.direction);
    if (sameDirectionIndex !== -1 && Math.random() > 0.35) {
      return enemy.tank.direction;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  processSpawns() {
    const { currentLevel, enemyPlanIndex, enemyQueue, activeEnemies } = this.game;
    if (!currentLevel) return;

    while (
      enemyPlanIndex < enemyQueue.length &&
      this.game.levelTime >= enemyQueue[enemyPlanIndex].time &&
      activeEnemies.length < MAX_CONCURRENT_ENEMIES
    ) {
      const plan = enemyQueue[enemyPlanIndex];
      if (this.spawnEnemy(plan)) {
        this.game.enemyPlanIndex++;
      } else {
        break;
      }
    }
    this.game.updateEnemyCounter();
  }

  spawnEnemy(plan) {
    const { currentLevel } = this.game;
    const spawnPoint = (currentLevel.enemySpawns ?? []).find((p) => p.id === plan.spawn) ?? currentLevel.enemySpawns?.[0];
    
    if (!spawnPoint || this.game.isTileOccupied(spawnPoint.x, spawnPoint.y, null)) {
      return false;
    }

    const stats = ENEMY_TYPES[plan.type] ?? ENEMY_TYPES.grunt;
    const tank = new Tank({
      faction: "enemy",
      direction: "down",
      tileSize: currentLevel.tileSize,
      ...stats,
    });
    tank.mount(this.game.root);
    tank.setTilePosition({ x: spawnPoint.x, y: spawnPoint.y });

    this.game.activeEnemies.push({
      id: plan.time,
      type: plan.type,
      tank,
      moveTimer: 0,
      shotTimer: 0.8 + Math.random() * 0.8,
      score: stats.score ?? 100,
    });

    return true;
  }
}