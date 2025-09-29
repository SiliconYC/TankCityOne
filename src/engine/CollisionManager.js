// path: src/engine/CollisionManager.js
import { spawnImpactEffect } from "../entities/impact.js";

export class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  update(delta) {
    for (const bullet of this.game.bullets) {
      if (!bullet.active) continue;
      bullet.update(delta);
      this.resolveBulletCollisions(bullet);
    }
    this.game.bullets = this.game.bullets.filter((b) => b.active);
  }

  resolveBulletCollisions(bullet) {
    if (!bullet.active) return;

    const { tileMap, currentLevel } = this.game;
    const bounds = bullet.getBounds();
    const worldWidth = tileMap.cols * currentLevel.tileSize;
    const worldHeight = tileMap.rows * currentLevel.tileSize;

    if (
      bounds.right < 0 ||
      bounds.left > worldWidth ||
      bounds.bottom < 0 ||
      bounds.top > worldHeight
    ) {
      bullet.destroy();
      return;
    }

    const center = this.getBoundsCenter(bounds);

    if (this.resolveBulletVsBullet(bullet, bounds, center)) {
      return;
    }

    const tilePos = tileMap.worldToTile(center);
    if (!this.game.isWithinBounds(tilePos)) {
      bullet.destroy();
      return;
    }

    if (tileMap.isBlockingForBullets(tilePos.x, tilePos.y)) {
      const tile = tileMap.getTile(tilePos.x, tilePos.y);
      const tileKind = tile?.kind ?? "empty";
      const result = tileMap.damageTile(tilePos.x, tilePos.y);
      const impactCenter = tileMap.tileCenter(tilePos);
      spawnImpactEffect(this.game.root, {
        x: impactCenter.x,
        y: impactCenter.y,
        size: currentLevel.tileSize * 0.9,
        variant: this.variantForTileImpact(tileKind, result),
      });
      bullet.destroy();
      if (result === "base-destroyed") {
        this.game.onBaseDestroyed();
      }
      return;
    }

    const targets = [this.game.player, ...this.game.activeEnemies.map((e) => e.tank)];
    for (const tank of targets) {
      if (!tank || tank === bullet.owner || tank.isDestroyed) continue;
      if (this.isFriendlyFire(bullet, tank)) continue;

      if (this.intersectsTank(bounds, tank)) {
        const destroyed = tank.applyDamage(1);
        spawnImpactEffect(this.game.root, destroyed ? {
          x: tank.world.x + currentLevel.tileSize / 2,
          y: tank.world.y + currentLevel.tileSize / 2,
          size: currentLevel.tileSize * 1.8,
          variant: "blast",
        } : {
          x: center.x,
          y: center.y,
          size: currentLevel.tileSize * 0.6,
          variant: "spark",
        });
        bullet.destroy();
        if (destroyed) {
          this.game.onTankDestroyed(tank, bullet.owner);
        }
        return;
      }
    }
  }

  resolveBulletVsBullet(bullet, bounds, center) {
    for (const other of this.game.bullets) {
      if (other === bullet || !other.active) continue;
      if (!this.canBulletsCollide(bullet, other)) continue;
      const otherBounds = other.getBounds();
      if (!this.intersectsBounds(bounds, otherBounds)) continue;

      const otherCenter = this.getBoundsCenter(otherBounds);
      spawnImpactEffect(this.game.root, {
        x: (center.x + otherCenter.x) / 2,
        y: (center.y + otherCenter.y) / 2,
        size: this.game.currentLevel.tileSize * 0.6,
        variant: "spark",
      });
      other.destroy();
      bullet.destroy();
      return true;
    }
    return false;
  }

  canBulletsCollide(a, b) {
    const factionA = a.owner?.faction;
    const factionB = b.owner?.faction;
    if (!factionA || !factionB) {
      return true;
    }
    return factionA !== factionB;
  }

  isFriendlyFire(bullet, tank) {
    const bulletFaction = bullet.owner?.faction;
    return Boolean(bulletFaction && bulletFaction === tank.faction);
  }

  variantForTileImpact(kind, result) {
    if (result === "base-destroyed") return "blast";
    switch (kind) {
      case "brick":
      case "forest":
        return "debris";
      case "base":
      case "base-core":
        return "blast";
      case "water":
        return "splash";
      case "steel":
      case "ice":
      case "spawn":
      default:
        return "spark";
    }
  }

  getBoundsCenter(bounds) {
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    };
  }

  intersectsBounds(a, b) {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  intersectsTank(bounds, tank) {
    const size = this.game.currentLevel.tileSize;
    const tankBounds = {
      left: tank.world.x,
      right: tank.world.x + size,
      top: tank.world.y,
      bottom: tank.world.y + size,
    };
    return this.intersectsBounds(bounds, tankBounds);
  }
}
