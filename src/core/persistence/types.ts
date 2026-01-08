/**
 * Persistence types and interfaces
 */

import type { WorldState } from '../types';

export interface WorldMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  templateId: string;
}

export interface StorageAdapter {
  /**
   * Save world state
   */
  save(worldId: string, state: WorldState): Promise<void>;

  /**
   * Load world state
   */
  load(worldId: string): Promise<WorldState | null>;

  /**
   * Delete world
   */
  delete(worldId: string): Promise<boolean>;

  /**
   * List all saved worlds
   */
  list(): Promise<WorldMetadata[]>;

  /**
   * Check if world exists
   */
  exists(worldId: string): Promise<boolean>;
}
