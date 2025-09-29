export const TILE_TYPES = {
  EMPTY: "empty",
  BRICK: "brick",
  STEEL: "steel",
  WATER: "water",
  FOREST: "forest",
  ICE: "ice",
  BASE: "base",
  BASE_CORE: "base-core",
  SPAWN: "spawn",
};

export const CHARACTER_MAP = {
  ".": TILE_TYPES.EMPTY,
  " ": TILE_TYPES.EMPTY,
  "B": TILE_TYPES.BRICK,
  "S": TILE_TYPES.STEEL,
  "W": TILE_TYPES.WATER,
  "F": TILE_TYPES.FOREST,
  "I": TILE_TYPES.ICE,
  "A": TILE_TYPES.BASE,
  "E": TILE_TYPES.BASE_CORE,
  "P": TILE_TYPES.SPAWN,
};

export const TILE_BEHAVIOUR = {
  [TILE_TYPES.EMPTY]: {
    passable: true,
    destructible: false,
    stopsBullets: false,
  },
  [TILE_TYPES.BRICK]: {
    passable: false,
    destructible: true,
    hitPoints: 2,
    stopsBullets: true,
  },
  [TILE_TYPES.STEEL]: {
    passable: false,
    destructible: false,
    stopsBullets: true,
  },
  [TILE_TYPES.WATER]: {
    passable: false,
    destructible: false,
    stopsBullets: false,
  },
  [TILE_TYPES.FOREST]: {
    passable: true,
    destructible: false,
    providesCover: true,
    stopsBullets: false,
  },
  [TILE_TYPES.ICE]: {
    passable: true,
    destructible: false,
    slippery: true,
    stopsBullets: false,
  },
  [TILE_TYPES.BASE]: {
    passable: false,
    destructible: false,
    stopsBullets: true,
  },
  [TILE_TYPES.BASE_CORE]: {
    passable: false,
    destructible: true,
    hitPoints: 1,
    stopsBullets: true,
    isBaseCore: true,
  },
  [TILE_TYPES.SPAWN]: {
    passable: true,
    destructible: false,
    stopsBullets: false,
  },
};

export function decodeChar(char) {
  return CHARACTER_MAP[char] ?? TILE_TYPES.EMPTY;
}
