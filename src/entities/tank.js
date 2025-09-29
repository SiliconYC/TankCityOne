// path: src/entities/tank.js
import { DIRECTION_VECTORS } from '../engine/constants.js';

const TANK_TEMPLATE_ID = "tank-template";

export class Tank {
  constructor({
    faction = "player",
    direction = "up",
    tileSize = 38,
    speed = 3,
    fireCooldown = 0.6,
    bulletSpeed = 12,
    hitPoints = 1,
    maxBullets = 1,
  }) {
    this.faction = faction;
    this.direction = direction;
    this.tileSize = tileSize;
    this.speed = speed; // tiles per second
    this.fireCooldown = fireCooldown;
    this.bulletSpeed = bulletSpeed; // tiles per second
    this.maxBullets = maxBullets;
    this.hitPoints = hitPoints;
    this.isDestroyed = false;

    this.world = { x: 0, y: 0 };
    this.tile = { x: 0, y: 0 };
    this.moveDirection = null;
    this.moveProgress = 0;
    this.startWorld = { x: 0, y: 0 };
    this.targetWorld = { x: 0, y: 0 };
    this.targetTile = { x: 0, y: 0 };
    this.reloadTimer = 0;
    this.activeBullets = 0;

    this.node = this.#createNode();
  }

  #createNode() {
    const template = document.getElementById(TANK_TEMPLATE_ID);
    if (!template) {
      throw new Error(`Missing <template id="${TANK_TEMPLATE_ID}"> for tank rendering`);
    }
    const fragment = template.content.cloneNode(true);
    const tank = fragment.querySelector("[data-entity='tank']");
    tank.dataset.faction = this.faction;
    tank.dataset.direction = this.direction;
    return tank;
  }

  mount(parent) {
    parent.appendChild(this.node);
    this.sync();
    return this;
  }

  setTilePosition({ x, y }) {
    this.tile = { x, y };
    this.world = {
      x: x * this.tileSize,
      y: y * this.tileSize,
    };
    this.moveDirection = null;
    this.moveProgress = 0;
    this.startWorld = { ...this.world };
    this.targetWorld = { ...this.world };
    this.targetTile = { ...this.tile };
    this.sync();
  }

  setDirection(direction) {
    if (!DIRECTION_VECTORS[direction]) {
      return;
    }
    this.direction = direction;
    this.node.dataset.direction = direction;
  }

  setFaction(faction) {
    this.faction = faction;
    this.node.dataset.faction = faction;
  }

  isMoving() {
    return this.moveDirection !== null;
  }

  beginMove(direction, targetTile) {
    this.setDirection(direction);
    this.moveDirection = direction;
    this.moveProgress = 0;
    this.startWorld = { ...this.world };
    this.targetTile = { ...targetTile };
    this.targetWorld = {
      x: targetTile.x * this.tileSize,
      y: targetTile.y * this.tileSize,
    };
  }

  cancelMove() {
    this.moveDirection = null;
    this.moveProgress = 0;
    this.targetTile = { ...this.tile };
    this.targetWorld = { ...this.world };
  }

  update(delta) {
    if (this.reloadTimer > 0) {
      this.reloadTimer = Math.max(0, this.reloadTimer - delta);
    }

    if (this.moveDirection) {
      this.moveProgress += delta * this.speed;
      const progress = Math.min(this.moveProgress, 1);
      this.world = {
        x: this.startWorld.x + (this.targetWorld.x - this.startWorld.x) * progress,
        y: this.startWorld.y + (this.targetWorld.y - this.startWorld.y) * progress,
      };
      this.sync();
      if (this.moveProgress >= 1) {
        this.tile = { ...this.targetTile };
        this.world = { ...this.targetWorld };
        this.moveDirection = null;
        this.moveProgress = 0;
        this.sync();
      }
    }
  }

  requestFire() {
    if (this.reloadTimer > 0) {
      return false;
    }
    if (this.activeBullets >= this.maxBullets) {
      return false;
    }
    this.reloadTimer = this.fireCooldown;
    this.activeBullets += 1;
    return true;
  }

  notifyBulletRemoved() {
    this.activeBullets = Math.max(0, this.activeBullets - 1);
  }

  applyDamage(amount = 1) {
    if (this.isDestroyed) {
      return false;
    }
    this.hitPoints -= amount;
    if (this.hitPoints <= 0) {
      this.isDestroyed = true;
      this.node.dataset.state = "destroyed";
      return true;
    }
    return false;
  }

  getDirectionVector() {
    return DIRECTION_VECTORS[this.direction] ?? DIRECTION_VECTORS.up;
  }

  sync() {
    this.node.style.transform = `translate(${this.world.x}px, ${this.world.y}px)`;
  }

  destroyNode() {
    this.node.remove();
  }
}