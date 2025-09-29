// path: src/entities/bullet.js
import { DIRECTION_VECTORS } from '../engine/constants.js';

const BULLET_TEMPLATE_ID = "bullet-template";

export class Bullet {
  constructor({ owner, direction, tileSize, speed }) {
    this.owner = owner;
    this.direction = direction;
    this.tileSize = tileSize;
    this.speed = speed; // tiles per second
    this.active = true;
    this.world = { x: 0, y: 0 };
    this.size = tileSize * 0.32;
    const vector = DIRECTION_VECTORS[direction] ?? DIRECTION_VECTORS.up;
    this.velocity = {
      x: vector.x * speed * tileSize,
      y: vector.y * speed * tileSize,
    };
    this.node = this.#createNode();
  }

  #createNode() {
    const template = document.getElementById(BULLET_TEMPLATE_ID);
    if (!template) {
      throw new Error(`Missing <template id="${BULLET_TEMPLATE_ID}"> for bullet rendering`);
    }
    const fragment = template.content.cloneNode(true);
    const bullet = fragment.querySelector("[data-entity='bullet']");
    return bullet;
  }

  mount(parent) {
    parent.appendChild(this.node);
    this.sync();
    return this;
  }

  setPosition({ x, y }) {
    this.world = { x, y };
    this.sync();
  }

  update(delta) {
    if (!this.active) {
      return;
    }
    this.world.x += this.velocity.x * delta;
    this.world.y += this.velocity.y * delta;
    this.sync();
  }

  sync() {
    this.node.style.transform = `translate(${this.world.x}px, ${this.world.y}px)`;
  }

  getBounds() {
    return {
      left: this.world.x,
      right: this.world.x + this.size,
      top: this.world.y,
      bottom: this.world.y + this.size,
    };
  }

  destroy() {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.node.remove();
    if (this.owner) {
      this.owner.notifyBulletRemoved();
    }
  }
}