/**
 * WorldManager - High-level API for managing worlds
 */

import type { WorldState } from '../types';
import type { StorageAdapter, WorldMetadata } from './types';
import { World, type WorldTemplate } from '../world';
import { LocalStorageAdapter } from './LocalStorageAdapter';

export class WorldManager {
  private adapter: StorageAdapter;
  private templates: Map<string, WorldTemplate> = new Map();
  private currentWorld: World | null = null;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter ?? new LocalStorageAdapter();
  }

  /**
   * Register a world template
   */
  registerTemplate(template: WorldTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all registered templates
   */
  getTemplates(): WorldTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): WorldTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create a new world from template
   */
  createWorld(templateId: string, customName?: string): World {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const world = World.fromTemplate(template);

    // If custom name provided, we'd need to modify the world
    // For now, just use the template name

    this.currentWorld = world;
    return world;
  }

  /**
   * Get current world
   */
  getCurrentWorld(): World | null {
    return this.currentWorld;
  }

  /**
   * Save current world
   */
  async saveCurrentWorld(): Promise<void> {
    if (!this.currentWorld) {
      throw new Error('No world is currently loaded');
    }

    const state = this.currentWorld.serialize();
    await this.adapter.save(this.currentWorld.id, state);
  }

  /**
   * Save world state
   */
  async saveWorld(worldId: string, state: WorldState): Promise<void> {
    await this.adapter.save(worldId, state);
  }

  /**
   * Load a saved world
   */
  async loadWorld(worldId: string, template: WorldTemplate): Promise<World | null> {
    const state = await this.adapter.load(worldId);
    if (!state) return null;

    const world = World.fromTemplate(template);
    world.loadState(state);

    this.currentWorld = world;
    return world;
  }

  /**
   * Delete a saved world
   */
  async deleteWorld(worldId: string): Promise<boolean> {
    return this.adapter.delete(worldId);
  }

  /**
   * List all saved worlds
   */
  async listSavedWorlds(): Promise<WorldMetadata[]> {
    return this.adapter.list();
  }

  /**
   * Check if a world exists
   */
  async worldExists(worldId: string): Promise<boolean> {
    return this.adapter.exists(worldId);
  }

  /**
   * Unload current world
   */
  unloadCurrentWorld(): void {
    if (this.currentWorld) {
      this.currentWorld.destroy();
      this.currentWorld = null;
    }
  }

  /**
   * Export world state as JSON
   */
  exportWorldAsJson(world: World): string {
    const state = world.serialize();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import world from JSON
   */
  importWorldFromJson(json: string, template: WorldTemplate): World {
    const state = JSON.parse(json) as WorldState;
    const world = World.fromTemplate(template);
    world.loadState(state);
    this.currentWorld = world;
    return world;
  }
}

// Singleton instance
let globalWorldManager: WorldManager | null = null;

export function getWorldManager(): WorldManager {
  if (!globalWorldManager) {
    globalWorldManager = new WorldManager();
  }
  return globalWorldManager;
}
