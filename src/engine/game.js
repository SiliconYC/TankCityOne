// path: src/engine/game.js
import { TileMap } from "./tilemap.js";
import { Tank } from "../entities/tank.js";
import { Bullet } from "../entities/bullet.js";
import { Input } from "./input.js";
import { PlayerController } from "./PlayerController.js";
import { EnemyManager } from "./EnemyManager.js";
import { CollisionManager } from "./CollisionManager.js";
import { DIRECTION_VECTORS } from "./constants.js";

const PLAYER_STATS = {
  speed: 3.4,
  fireCooldown: 0.45,
  bulletSpeed: 16,
  hitPoints: 1,
  maxBullets: 1,
};

export class Game {
  constructor({ root, levels, ui }) {
    this.root = root;
    this.levels = levels;
    this.ui = ui;

    // 状态
    this.levelIndex = 0;
    this.state = "idle";
    this.score = 0;
    this.levelTime = 0;
    this.lastFrame = 0;
    this.nextAction = null;

    // 实体
    this.tileMap = null;
    this.player = null;
    this.playerLives = 0;
    this.respawnTimer = 0;
    this.enemyQueue = [];
    this.enemyPlanIndex = 0;
    this.activeEnemies = [];
    this.bullets = [];

    // 系统/管理器
    this.input = new Input();
    this.playerController = new PlayerController(this);
    this.enemyManager = new EnemyManager(this);
    this.collisionManager = new CollisionManager(this);
  }

  init() {
    if (!this.root) throw new Error("Game root element missing");

    this.input.bind();
    this.loadLevel(this.levelIndex);

    this.state = "awaiting-start";
    this.showOverlay({
      title: "准备战斗",
      body: "点击按钮或按回车键开始守护基地。",
      button: "开始",
    });
  }

  loadLevel(index) {
    this.levelIndex = index;
    const level = this.levels[index];
    if (!level) throw new Error(`无法加载第 ${index + 1} 关`);
    this.prepareLevel(level);
  }

  prepareLevel(level) {
    this.currentLevel = level;
    this.score = 0;
    this.levelTime = 0;
    this.lastFrame = 0;

    this.enemyQueue = Array.from(level.enemyPlan ?? []);
    this.enemyPlanIndex = 0;
    this.activeEnemies.forEach(e => e.tank.destroyNode());
    this.activeEnemies = [];
    this.bullets.forEach((b) => b.destroy());
    this.bullets = [];

    this.playerLives = level.player?.lives ?? 3;
    this.updateScoreUI();
    this.updateLivesUI();
    this.updateEnemyCounter();

    this.ui.stage.textContent = String(level.stage ?? this.levelIndex + 1);
    this.ui.levelName.textContent = level.name ?? `Level ${this.levelIndex + 1}`;

    this.tileMap = new TileMap({
      layout: level.layout,
      tileSize: level.tileSize,
      root: this.root,
    });
    this.tileMap.build();
    this.tileMap.mount(this.root);

    this.spawnPlayerImmediate();
  }

  spawnPlayerImmediate() {
    if (!this.currentLevel?.player) return;
    if (this.player) this.player.destroyNode();
    
    const spawn = this.currentLevel.player.spawn ?? { x: 0, y: 0, facing: "up" };
    this.player = new Tank({
      faction: "player",
      direction: spawn.facing ?? "up",
      tileSize: this.currentLevel.tileSize,
      ...PLAYER_STATS,
    });
    this.player.mount(this.root);
    this.player.setTilePosition({ x: spawn.x, y: spawn.y });
    this.respawnTimer = 0;
  }

  startLevel() {
    if (this.state === "running") return;
    this.hideOverlay();
    this.state = "running";
    this.levelTime = 0;
    this.lastFrame = performance.now();
    requestAnimationFrame(this.loop);
  }

  loop = (timestamp) => {
    if (this.state !== "running") {
      this.ui.fps.textContent = "--";
      return;
    }

    const delta = (timestamp - this.lastFrame) / 1000;
    this.lastFrame = timestamp;
    this.levelTime += delta;

    this.update(delta);

    const fps = Math.round(1 / Math.max(delta, 0.0001));
    this.ui.fps.textContent = String(Math.min(fps, 240));
    this.input.clearFrameState();

    if (this.state === "running") {
      requestAnimationFrame(this.loop);
    }
  };

  update(delta) {
    if (this.input.consume("pause")) {
      this.pause();
      return;
    }
    this.playerController.update(delta);
    this.enemyManager.update(delta);
    this.collisionManager.update(delta);
    this.handleRespawn(delta);
    this.checkVictoryCondition();
  }

  tryMoveTank(tank, direction) {
    const vector = DIRECTION_VECTORS[direction];
    if (!vector) {
      return false;
    }

    const target = {
      x: tank.tile.x + vector.x,
      y: tank.tile.y + vector.y,
    };
    
    if (
      !this.isWithinBounds(target) ||
      !this.tileMap.isPassable(target.x, target.y) ||
      this.isTileOccupied(target.x, target.y, tank)
    ) {
      return false;
    }
    tank.beginMove(direction, target);
    return true;
  }

  isWithinBounds({ x, y }) {
    return x >= 0 && y >= 0 && x < this.tileMap.cols && y < this.tileMap.rows;
  }
  
  isTileOccupied(x, y, ignoreTank = null) {
    const tanks = [this.player, ...this.activeEnemies.map(e => e.tank)];
    for (const tank of tanks) {
        if (!tank || tank === ignoreTank) continue;
        const occupied = [tank.tile];
        if (tank.isMoving()) occupied.push(tank.targetTile);
        if (occupied.some((pos) => pos.x === x && pos.y === y)) return true;
    }
    return false;
  }

  tryFire(tank) {
    if (!tank || tank.isDestroyed || !tank.requestFire()) {
      return false;
    }
    const bullet = new Bullet({
      owner: tank,
      direction: tank.direction,
      tileSize: this.currentLevel.tileSize,
      speed: tank.bulletSpeed,
    });
    const position = this.computeMuzzlePosition(tank, bullet.size);
    bullet.mount(this.root);
    bullet.setPosition(position);
    this.bullets.push(bullet);
    return true;
  }

  computeMuzzlePosition(tank, bulletSize) {
    const halfTile = this.currentLevel.tileSize / 2;
    const offset = halfTile - bulletSize / 2;
    const baseX = tank.world.x;
    const baseY = tank.world.y;

    switch (tank.direction) {
      case "up": return { x: baseX + offset, y: baseY - bulletSize / 2 };
      case "down": return { x: baseX + offset, y: baseY + this.currentLevel.tileSize - bulletSize / 2 };
      case "left": return { x: baseX - bulletSize / 2, y: baseY + offset };
      case "right": default: return { x: baseX + this.currentLevel.tileSize - bulletSize / 2, y: baseY + offset };
    }
  }

  onTankDestroyed(tank, killer) {
    if (this.player && tank === this.player) {
      this.handlePlayerDestroyed();
      return;
    }

    const index = this.activeEnemies.findIndex((enemy) => enemy.tank === tank);
    if (index !== -1) {
      const [enemy] = this.activeEnemies.splice(index, 1);
      enemy.tank.destroyNode();
      if (killer?.faction === "player") {
        this.score += enemy.score ?? 100;
      }
      this.updateScoreUI();
      this.updateEnemyCounter();
    }
  }

  handlePlayerDestroyed() {
    this.playerLives = Math.max(0, this.playerLives - 1);
    this.updateLivesUI();
    if (this.player) {
      this.player.destroyNode();
      this.player = null;
    }

    if (this.playerLives <= 0) {
      this.gameOver({
        title: "任务失败",
        body: "坦克全部损毁，基地失守。点击重试本关。",
        button: "重试",
        onConfirm: () => this.restartLevel(),
      });
    } else {
      this.respawnTimer = 2.5;
    }
  }

  handleRespawn(delta) {
    if (this.player || this.playerLives <= 0) return;
    this.respawnTimer -= delta;
    if (this.respawnTimer <= 0) {
      this.spawnPlayerImmediate();
    }
  }

  checkVictoryCondition() {
    if (this.enemyPlanIndex < this.enemyQueue.length) return;
    if (this.activeEnemies.length > 0) return;
    if (this.state === "running") this.completeLevel();
  }

  completeLevel() {
    this.state = "over";
    const hasNext = this.levelIndex + 1 < this.levels.length;
    const scoreLine = `当前积分：${this.score}`;
    this.showOverlay({
      title: "关卡完成",
      body: hasNext ? `敌军已被击退，准备迎接下一关。\n${scoreLine}` : `恭喜！你击败了全部敌人。\n${scoreLine}`,
      button: hasNext ? "下一关" : "重玩",
    });
    this.nextAction = hasNext ? () => this.loadLevel(this.levelIndex + 1) : () => this.restartLevel();
  }

  updateEnemyCounter() {
    const total = (this.enemyQueue.length - this.enemyPlanIndex) + this.activeEnemies.length;
    this.ui.enemies.textContent = String(total);
  }

  updateScoreUI() {
    if (this.ui.score) this.ui.score.textContent = String(this.score);
  }

  updateLivesUI() {
    this.ui.lives.textContent = String(this.playerLives);
  }

  onBaseDestroyed() {
    this.gameOver({
      title: "基地被摧毁",
      body: "指挥部已被炸毁，任务失败。点击重试本关。",
      button: "重试",
      onConfirm: () => this.restartLevel(),
    });
  }

  gameOver({ title, body, button, onConfirm }) {
    if (this.state === "over") return;
    this.state = "over";
    const scoreLine = `当前积分：${this.score}`;
    this.showOverlay({ title, body: `${body}\n${scoreLine}`, button: button ?? "重试" });
    this.nextAction = () => {
      this.state = "awaiting-start";
      onConfirm?.();
    };
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.state = "awaiting-start";
  }

  pause() {
    if (this.state !== "running") return;
    this.state = "paused";
    this.showOverlay({ title: "已暂停", body: "点击继续或按回车键恢复游戏。", button: "继续" });
  }

  resume() {
    if (this.state !== "paused") return;
    this.hideOverlay();
    this.state = "running";
    this.lastFrame = performance.now();
    requestAnimationFrame(this.loop);
  }

  handleOverlayConfirm() {
    if (this.state === "awaiting-start") {
      this.startLevel();
    } else if (this.state === "paused") {
      this.resume();
    } else if (this.state === "over" && this.nextAction) {
      const action = this.nextAction;
      this.nextAction = null;
      action();
      // After loading the next level or restarting, show the "get ready" screen again
      if (this.state !== 'running') {
          this.showOverlay({
              title: "准备战斗",
              body: "点击按钮或按回车继续作战。",
              button: "开始",
          });
      }
    }
  }

  showOverlay({ title, body, button }) {
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayBody.textContent = body;
    this.ui.overlayButton.textContent = button ?? "继续";
    this.ui.overlay.hidden = false;
  }

  hideOverlay() {
    this.ui.overlay.hidden = true;
  }
}