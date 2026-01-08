/**
 * GameMap - Manages the game world's spatial grid
 */

import type { Position, Direction, TileType, MapData, LocationBounds } from '../types';

export class GameMap {
  private width: number;
  private height: number;
  private tiles: TileType[][];
  private locationBounds: Record<string, LocationBounds>;

  constructor(mapData: MapData) {
    this.width = mapData.width;
    this.height = mapData.height;
    this.tiles = mapData.tiles;
    this.locationBounds = mapData.locationBounds;
  }

  /**
   * Get map dimensions
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get tile at position
   */
  getTile(x: number, y: number): TileType | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y]?.[x] ?? null;
  }

  /**
   * Set tile at position
   */
  setTile(x: number, y: number, type: TileType): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    if (!this.tiles[y]) {
      this.tiles[y] = [];
    }
    this.tiles[y][x] = type;
    return true;
  }

  /**
   * Check if position is valid
   */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if tile is walkable
   */
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;

    const walkableTiles: TileType[] = ['grass', 'path', 'floor', 'door'];
    return walkableTiles.includes(tile);
  }

  /**
   * Get new position after moving in a direction
   */
  getNewPosition(position: Position, direction: Direction): Position {
    const newPosition = { ...position };

    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case 'down':
        newPosition.y = Math.min(this.height - 1, newPosition.y + 1);
        break;
      case 'left':
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case 'right':
        newPosition.x = Math.min(this.width - 1, newPosition.x + 1);
        break;
    }

    return newPosition;
  }

  /**
   * Get direction from one position to another
   */
  getDirectionTowards(from: Position, to: Position): Direction | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      return dy > 0 ? 'down' : 'up';
    }
    return null;
  }

  /**
   * Calculate Manhattan distance between two positions
   */
  getDistance(from: Position, to: Position): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * Get location name from position
   */
  getLocationFromPosition(position: Position): string {
    for (const [name, bounds] of Object.entries(this.locationBounds)) {
      if (
        position.x >= bounds.minX &&
        position.x <= bounds.maxX &&
        position.y >= bounds.minY &&
        position.y <= bounds.maxY
      ) {
        return name;
      }
    }
    return 'Outside';
  }

  /**
   * Get center of a named location
   */
  getLocationCenter(locationName: string): Position | null {
    const bounds = this.locationBounds[locationName];
    if (!bounds) return null;

    return {
      x: Math.floor((bounds.minX + bounds.maxX) / 2),
      y: Math.floor((bounds.minY + bounds.maxY) / 2),
    };
  }

  /**
   * Get all positions within a location
   */
  getPositionsInLocation(locationName: string): Position[] {
    const bounds = this.locationBounds[locationName];
    if (!bounds) return [];

    const positions: Position[] = [];
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  /**
   * Simple A* pathfinding
   */
  findPath(
    from: Position,
    to: Position,
    occupiedPositions: Position[] = []
  ): Position[] {
    const occupied = new Set(
      occupiedPositions.map((p) => `${p.x},${p.y}`)
    );

    const openSet: Array<{
      position: Position;
      g: number;
      f: number;
      parent: Position | null;
    }> = [];
    const closedSet = new Set<string>();

    const heuristic = (a: Position, b: Position) =>
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    openSet.push({
      position: from,
      g: 0,
      f: heuristic(from, to),
      parent: null,
    });

    const cameFrom = new Map<string, Position>();

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.position.x},${current.position.y}`;

      if (current.position.x === to.x && current.position.y === to.y) {
        // Reconstruct path
        const path: Position[] = [];
        let currentPos: Position | undefined = current.position;
        while (currentPos) {
          path.unshift(currentPos);
          const key = `${currentPos.x},${currentPos.y}`;
          currentPos = cameFrom.get(key);
        }
        return path;
      }

      closedSet.add(currentKey);

      // Check neighbors
      const directions: Direction[] = ['up', 'down', 'left', 'right'];
      for (const dir of directions) {
        const neighbor = this.getNewPosition(current.position, dir);
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) continue;
        if (!this.isWalkable(neighbor.x, neighbor.y)) continue;
        if (occupied.has(neighborKey)) continue;

        const g = current.g + 1;
        const f = g + heuristic(neighbor, to);

        const existingIndex = openSet.findIndex(
          (n) => n.position.x === neighbor.x && n.position.y === neighbor.y
        );

        if (existingIndex === -1 || g < openSet[existingIndex].g) {
          cameFrom.set(neighborKey, current.position);

          if (existingIndex !== -1) {
            openSet[existingIndex].g = g;
            openSet[existingIndex].f = f;
          } else {
            openSet.push({
              position: neighbor,
              g,
              f,
              parent: current.position,
            });
          }
        }
      }
    }

    return []; // No path found
  }

  /**
   * Get valid moves from a position
   */
  getValidMoves(
    position: Position,
    occupiedPositions: Position[] = []
  ): Direction[] {
    const occupied = new Set(
      occupiedPositions.map((p) => `${p.x},${p.y}`)
    );

    const validMoves: Direction[] = [];
    const directions: Direction[] = ['up', 'down', 'left', 'right'];

    for (const dir of directions) {
      const newPos = this.getNewPosition(position, dir);
      const key = `${newPos.x},${newPos.y}`;

      if (
        this.isWalkable(newPos.x, newPos.y) &&
        !occupied.has(key) &&
        (newPos.x !== position.x || newPos.y !== position.y)
      ) {
        validMoves.push(dir);
      }
    }

    return validMoves;
  }

  /**
   * Serialize map data
   */
  serialize(): MapData {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles,
      locationBounds: this.locationBounds,
    };
  }

  /**
   * Create from serialized data
   */
  static deserialize(data: MapData): GameMap {
    return new GameMap(data);
  }

  /**
   * Create an empty map
   */
  static createEmpty(
    width: number,
    height: number,
    defaultTile: TileType = 'grass'
  ): GameMap {
    const tiles: TileType[][] = [];
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = defaultTile;
      }
    }

    return new GameMap({
      width,
      height,
      tiles,
      locationBounds: {},
    });
  }
}
