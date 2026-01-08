/**
 * Core Engine - Public API
 *
 * This is the main entry point for the generative agents simulation engine.
 * It's framework-agnostic and can be used with React, Vue, or any other frontend.
 */

// Types
export * from './types';

// Events
export { EventBus, getGlobalEventBus, resetGlobalEventBus } from './events';
export type { EventHandler } from './events';

// Time
export { TimeSystem } from './time';
export type { TimeSystemConfig } from './time';

// Memory
export { MemoryStream, createMemory, estimateImportance } from './agents/memory';

// Planning
export {
  Planner,
  createPlan,
  decomposePlanToHourly,
  decomposePlanToDetailed,
  getCurrentPlan,
  getPlanEmoji,
  formatPlanForDisplay,
  shouldReplan,
  getDefaultRoutine,
  createRoutineGenerator,
} from './agents/planning';

// Social
export { ConversationManager } from './agents/social';

// Characters
export { Character, createCharacterFromTemplate, CharacterManager } from './characters';

// Environment
export { Environment } from './environment';

// Map
export { GameMap } from './map';

// World
export { World } from './world';
export type { WorldTemplate } from './world';

// Persistence
export {
  LocalStorageAdapter,
  WorldManager,
  getWorldManager,
} from './persistence';
export type { StorageAdapter, WorldMetadata } from './persistence';
