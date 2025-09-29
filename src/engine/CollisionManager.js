// path: src/engine/CollisionManager.js
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

    if (bounds.right < 0 || bounds.left > worldWidth || bounds.bottom < 0 || bounds.top > worldHeight) {
      bullet.destroy();
      return;
    }

    const center = { x: bounds.left + bullet.size / 2, y: bounds.top + bullet.size / 2 };
    const tilePos = tileMap.worldToTile(center);

    if (!this.game.isWithinBounds(tilePos)) {
      bullet.destroy();
      return;
    }

    if (tileMap.isBlockingForBullets(tilePos.x, tilePos.y)) {
      const result = tileMap.damageTile(tilePos.x, tilePos.y);
      bullet.destroy();
      if (result === "base-destroyed") {
        this.game.onBaseDestroyed();
      }
      return;
    }

    const targets = [this.game.player, ...this.game.activeEnemies.map(e => e.tank)];
    for (const tank of targets) {
      if (!tank || tank === bullet.owner || tank.isDestroyed) continue;

      if (this.intersectsTank(bounds, tank)) {
        const wasDestroyed = tank.applyDamage(1);
        bullet.destroy();
        if (wasDestroyed) {
          this.game.onTankDestroyed(tank, bullet.owner);
        }
        return;
      }
    }
  }

  intersectsTank(bounds, tank) {
    const size = this.game.currentLevel.tileSize;
    const tankBounds = {
      left: tank.world.x,
      right: tank.world.x + size,
      top: tank.world.y,
      bottom: tank.world.y + size,
    };
    return !(
      bounds.right <= tankBounds.left ||
      bounds.left >= tankBounds.right ||
      bounds.bottom <= tankBounds.top ||
      bounds.top >= tankBounds.bottom
    );
  }
}