/**
 * CharacterManager - Manages all characters in the simulation
 */

import type {
  CharacterData,
  CharacterTemplate,
  CharacterSprite,
  Position,
  GameTime,
} from '../types';
import { Character, createCharacterFromTemplate } from './Character';
import { EventBus } from '../events';

const PERCEPTION_RADIUS = 5;

export class CharacterManager {
  private characters: Map<string, Character> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Add a character to the manager
   */
  add(character: Character): void {
    this.characters.set(character.id, character);
    this.eventBus.emit('character:added', { characterId: character.id });
  }

  /**
   * Create and add a character from template
   */
  addFromTemplate(
    template: CharacterTemplate,
    sprite: CharacterSprite
  ): Character {
    const character = createCharacterFromTemplate(template, sprite, this.eventBus);
    this.add(character);
    return character;
  }

  /**
   * Remove a character
   */
  remove(id: string): boolean {
    const removed = this.characters.delete(id);
    if (removed) {
      this.eventBus.emit('character:removed', { characterId: id });
    }
    return removed;
  }

  /**
   * Get a character by ID
   */
  get(id: string): Character | undefined {
    return this.characters.get(id);
  }

  /**
   * Get all characters
   */
  getAll(): Character[] {
    return Array.from(this.characters.values());
  }

  /**
   * Get all character IDs
   */
  getAllIds(): string[] {
    return Array.from(this.characters.keys());
  }

  /**
   * Get number of characters
   */
  get count(): number {
    return this.characters.size;
  }

  /**
   * Get nearby characters within perception radius
   */
  getNearby(
    characterId: string,
    radius: number = PERCEPTION_RADIUS
  ): Character[] {
    const character = this.get(characterId);
    if (!character) return [];

    const position = character.position;
    return this.getAll().filter((other) => {
      if (other.id === characterId) return false;
      const dx = Math.abs(other.position.x - position.x);
      const dy = Math.abs(other.position.y - position.y);
      return dx <= radius && dy <= radius;
    });
  }

  /**
   * Get characters at a specific position
   */
  getAtPosition(position: Position): Character[] {
    return this.getAll().filter(
      (c) => c.position.x === position.x && c.position.y === position.y
    );
  }

  /**
   * Check if a position is occupied
   */
  isPositionOccupied(position: Position, excludeId?: string): boolean {
    return this.getAll().some(
      (c) =>
        c.id !== excludeId &&
        c.position.x === position.x &&
        c.position.y === position.y
    );
  }

  /**
   * Initialize daily plans for all characters
   */
  initializeDailyPlans(day: number): void {
    this.characters.forEach((character) => {
      character.initializeDailyPlan(day);
    });
  }

  /**
   * Update all characters' actions based on current time
   */
  updateActionsFromPlans(time: GameTime): void {
    this.characters.forEach((character) => {
      character.updateActionFromPlan(time);
    });
  }

  /**
   * Serialize all characters
   */
  serialize(): CharacterData[] {
    return this.getAll().map((c) => c.serialize());
  }

  /**
   * Deserialize and restore characters
   */
  deserialize(data: CharacterData[]): void {
    this.characters.clear();
    data.forEach((charData) => {
      const character = Character.deserialize(charData, this.eventBus);
      this.characters.set(character.id, character);
    });
  }

  /**
   * Clear all characters
   */
  clear(): void {
    this.characters.clear();
  }

  /**
   * Iterate over all characters
   */
  forEach(callback: (character: Character) => void): void {
    this.characters.forEach(callback);
  }

  /**
   * Find characters matching a predicate
   */
  find(predicate: (character: Character) => boolean): Character | undefined {
    for (const character of this.characters.values()) {
      if (predicate(character)) return character;
    }
    return undefined;
  }

  /**
   * Filter characters matching a predicate
   */
  filter(predicate: (character: Character) => boolean): Character[] {
    return this.getAll().filter(predicate);
  }
}
