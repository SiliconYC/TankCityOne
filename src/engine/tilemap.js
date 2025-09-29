// path: src/engine/tilemap.js
import { decodeChar, TILE_BEHAVIOUR, TILE_TYPES } from "../data/tiles.js";

export class TileMap {
  constructor({ layout, tileSize, root }) {
    this.layout = layout;
    this.tileSize = tileSize;
    this.root = root;
    this.rows = layout.length;
    this.cols = layout[0].length;
    this.grid = [];
    this.baseTile = null;
  }

  build() {
    this.grid = this.layout.map((row, y) =>
      row.split("").map((char, x) => {
        const kind = decodeChar(char);
        const behaviour = TILE_BEHAVIOUR[kind] ?? TILE_BEHAVIOUR.empty;
        const tile = {
          x,
          y,
          char,
          kind,
          behaviour,
          damage: 0,
          el: null,
        };
        if (behaviour?.isBaseCore) {
          this.baseTile = tile;
        }
        return tile;
      })
    );
  }

  mount(container) {
    if (!container) {
      throw new Error("TileMap requires a valid container element");
    }
    this.root = container;
    this.render();
  }

  render() {
    if (!this.root) {
      return;
    }

    this.root.style.setProperty("--grid-cols", String(this.cols));
    this.root.style.setProperty("--grid-rows", String(this.rows));
    if (this.tileSize) {
      this.root.style.setProperty("--tile-size", `${this.tileSize}px`);
    }

    this.root.innerHTML = "";
    const fragment = document.createDocumentFragment();

    for (const row of this.grid) {
      for (const tile of row) {
        const el = document.createElement("div");
        el.className = "tile";
        el.dataset.kind = tile.kind;
        el.dataset.x = String(tile.x);
        el.dataset.y = String(tile.y);
        fragment.appendChild(el);
        tile.el = el;
      }
    }

    this.root.appendChild(fragment);
  }

  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) {
      return null;
    }
    return this.grid[y][x];
  }

  worldToTile({ x, y }) {
    return {
      x: Math.floor(x / this.tileSize),
      y: Math.floor(y / this.tileSize),
    };
  }

  tileToWorld({ x, y }) {
    return {
      x: x * this.tileSize,
      y: y * this.tileSize,
    };
  }

  tileCenter({ x, y }) {
    return {
      x: x * this.tileSize + this.tileSize / 2,
      y: y * this.tileSize + this.tileSize / 2,
    };
  }

  isPassable(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) {
      return false;
    }
    return Boolean(tile.behaviour?.passable);
  }

  isBlockingForBullets(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) {
      return true;
    }
    return Boolean(tile.behaviour?.stopsBullets);
  }

  damageTile(x, y, amount = 1) {
    const tile = this.getTile(x, y);
    if (!tile) {
      return "out-of-bounds";
    }
    if (!tile.behaviour?.destructible) {
      return tile.behaviour?.isBaseCore ? "base-damaged" : "blocked";
    }

    tile.damage += amount;
    tile.el.dataset.damage = String(tile.damage);
    const hitPoints = tile.behaviour.hitPoints ?? 1;

    if (tile.damage >= hitPoints) {
      const wasBase = Boolean(tile.behaviour?.isBaseCore);
      if (wasBase) {
        tile.el.dataset.kind = TILE_TYPES.BASE_CORE;
        tile.el.dataset.state = "destroyed";
        tile.behaviour = { ...tile.behaviour, destructible: false, passable: false };
        return "base-destroyed";
      }
      this.setTileKind(tile, TILE_TYPES.EMPTY);
      return "destroyed";
    }

    return "damaged";
  }

  setTileKind(tile, kind) {
    tile.kind = kind;
    tile.behaviour = TILE_BEHAVIOUR[kind] ?? TILE_BEHAVIOUR.empty;
    tile.damage = 0;
    tile.el.dataset.kind = kind;
    if (tile.el.dataset.damage) {
      delete tile.el.dataset.damage;
    }
  }

  forEachTile(callback) {
    for (const row of this.grid) {
      for (const tile of row) {
        callback(tile);
      }
    }
  }
}