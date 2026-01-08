/**
 * LocalStorageAdapter - Browser localStorage-based persistence
 */

import type { WorldState } from '../types';
import type { StorageAdapter, WorldMetadata } from './types';

const STORAGE_PREFIX = 'generative-agents-world-';
const INDEX_KEY = 'generative-agents-worlds-index';

export class LocalStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  async save(worldId: string, state: WorldState): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const key = STORAGE_PREFIX + worldId;
    const serialized = JSON.stringify(state);

    try {
      localStorage.setItem(key, serialized);
      await this.updateIndex(worldId, state);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Try deleting some saved worlds.');
      }
      throw error;
    }
  }

  async load(worldId: string): Promise<WorldState | null> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const key = STORAGE_PREFIX + worldId;
    const data = localStorage.getItem(key);

    if (!data) return null;

    try {
      return JSON.parse(data) as WorldState;
    } catch {
      console.error('Failed to parse world state:', worldId);
      return null;
    }
  }

  async delete(worldId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const key = STORAGE_PREFIX + worldId;
    const existed = localStorage.getItem(key) !== null;

    localStorage.removeItem(key);
    await this.removeFromIndex(worldId);

    return existed;
  }

  async list(): Promise<WorldMetadata[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const indexData = localStorage.getItem(INDEX_KEY);
    if (!indexData) return [];

    try {
      return JSON.parse(indexData) as WorldMetadata[];
    } catch {
      return [];
    }
  }

  async exists(worldId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const key = STORAGE_PREFIX + worldId;
    return localStorage.getItem(key) !== null;
  }

  private async updateIndex(worldId: string, state: WorldState): Promise<void> {
    const index = await this.list();

    const metadata: WorldMetadata = {
      id: worldId,
      name: state.config.name,
      description: state.config.description,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      templateId: 'custom', // Would be set by the caller
    };

    const existingIndex = index.findIndex((w) => w.id === worldId);
    if (existingIndex >= 0) {
      index[existingIndex] = metadata;
    } else {
      index.push(metadata);
    }

    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  private async removeFromIndex(worldId: string): Promise<void> {
    const index = await this.list();
    const filtered = index.filter((w) => w.id !== worldId);
    localStorage.setItem(INDEX_KEY, JSON.stringify(filtered));
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; total: number } {
    if (!this.isAvailable()) {
      return { used: 0, total: 0 };
    }

    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // localStorage typically has a 5MB limit
    const total = 5 * 1024 * 1024;

    return { used: used * 2, total }; // * 2 for UTF-16
  }

  /**
   * Clear all saved worlds
   */
  async clearAll(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(INDEX_KEY);
  }
}
