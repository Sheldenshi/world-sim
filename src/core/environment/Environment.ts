/**
 * Environment - Manages the world's spatial hierarchy and locations
 */

import type { EnvironmentNode, Position, LocationBounds } from '../types';

export class Environment {
  private tree: EnvironmentNode;
  private locationBounds: Record<string, LocationBounds>;

  constructor(tree: EnvironmentNode, locationBounds: Record<string, LocationBounds>) {
    this.tree = tree;
    this.locationBounds = locationBounds;
  }

  /**
   * Get the environment tree
   */
  getTree(): EnvironmentNode {
    return this.tree;
  }

  /**
   * Get location bounds
   */
  getLocationBounds(): Record<string, LocationBounds> {
    return { ...this.locationBounds };
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
   * Get the full location path
   */
  getLocationPath(position: Position): string[] {
    const locationName = this.getLocationFromPosition(position);

    // This should be customized per world template
    // For now, return a simple path
    return [this.tree.name, locationName];
  }

  /**
   * Find a node in the environment tree by name
   */
  findNode(name: string, node: EnvironmentNode = this.tree): EnvironmentNode | null {
    if (node.name.toLowerCase().includes(name.toLowerCase())) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNode(name, child);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Get all objects in a location
   */
  getObjectsInLocation(locationName: string): EnvironmentNode[] {
    const node = this.findNode(locationName);
    if (!node) return [];

    const objects: EnvironmentNode[] = [];

    const collectObjects = (n: EnvironmentNode) => {
      if (n.type === 'object') {
        objects.push(n);
      }
      if (n.children) {
        n.children.forEach(collectObjects);
      }
    };

    collectObjects(node);
    return objects;
  }

  /**
   * Update an object's state
   */
  updateObjectState(objectName: string, newState: string): boolean {
    const updateInTree = (node: EnvironmentNode): boolean => {
      if (
        node.name.toLowerCase() === objectName.toLowerCase() &&
        node.type === 'object'
      ) {
        node.state = newState;
        return true;
      }

      if (node.children) {
        for (const child of node.children) {
          if (updateInTree(child)) return true;
        }
      }

      return false;
    };

    return updateInTree(this.tree);
  }

  /**
   * Generate natural language description of environment at position
   */
  describeEnvironment(position: Position): string {
    const location = this.getLocationFromPosition(position);
    const path = this.getLocationPath(position);
    const objects = this.getObjectsInLocation(location);

    let description = `You are in ${path.join(' > ')}. `;

    if (objects.length > 0) {
      const objectDescriptions = objects
        .slice(0, 5)
        .map((obj) => (obj.state ? `${obj.name} (${obj.state})` : obj.name))
        .join(', ');
      description += `Nearby objects: ${objectDescriptions}.`;
    }

    return description;
  }

  /**
   * Get nearby locations from a position
   */
  getNearbyLocations(position: Position, radius: number = 10): string[] {
    const nearby: string[] = [];

    for (const [name, bounds] of Object.entries(this.locationBounds)) {
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const distance = Math.sqrt(
        Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
      );

      if (distance <= radius) {
        nearby.push(name);
      }
    }

    return nearby;
  }

  /**
   * Get the center position of a named location
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
   * Check if a position is within a specific location
   */
  isInLocation(position: Position, locationName: string): boolean {
    const bounds = this.locationBounds[locationName];
    if (!bounds) return false;

    return (
      position.x >= bounds.minX &&
      position.x <= bounds.maxX &&
      position.y >= bounds.minY &&
      position.y <= bounds.maxY
    );
  }

  /**
   * Serialize environment
   */
  serialize(): { tree: EnvironmentNode; locationBounds: Record<string, LocationBounds> } {
    return {
      tree: this.tree,
      locationBounds: this.locationBounds,
    };
  }

  /**
   * Create from serialized data
   */
  static deserialize(data: {
    tree: EnvironmentNode;
    locationBounds: Record<string, LocationBounds>;
  }): Environment {
    return new Environment(data.tree, data.locationBounds);
  }
}
