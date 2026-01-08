/**
 * Core Types for the Generative Agents Simulation
 * These types are framework-agnostic and can be used across the entire core engine.
 */

// ============== BASIC TYPES ==============

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

// ============== TIME TYPES ==============

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  speed: number;
  isPaused: boolean;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// ============== MEMORY TYPES ==============

export type MemoryType = 'observation' | 'reflection' | 'plan' | 'conversation' | 'command';

export interface Memory {
  id: string;
  content: string;
  createdAt: number;
  lastAccessedAt: number;
  importance: number; // 1-10 scale
  type: MemoryType;
  embedding?: number[]; // For relevance calculation
  pointers?: string[]; // References to other memories (for reflections)
  // Information diffusion tracking
  sourceCharacterId?: string; // Who told us this information
  diffusedTo?: string[]; // Who we've shared this with
  originalMemoryId?: string; // If this is learned info, reference to original
}

export interface RetrievalWeights {
  recency: number;
  importance: number;
  relevance: number;
}

// ============== PLANNING TYPES ==============

export interface Plan {
  id: string;
  description: string;
  startTime: { hour: number; minute: number };
  duration: number; // in minutes
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  subPlans?: Plan[]; // Recursive decomposition
}

export interface DailyPlan {
  day: number;
  broadStrokes: Plan[]; // High-level plan (5-8 chunks)
  hourlyPlans: Plan[]; // Decomposed hourly
  detailedPlans: Plan[]; // 5-15 minute chunks
}

// ============== RELATIONSHIP TYPES ==============

export interface Relationship {
  characterId: string;
  description: string;
  lastInteraction: number;
  sentiment: number; // -1 to 1
}

// ============== CHARACTER TYPES ==============

export interface CharacterSprite {
  idle: Record<Direction, number[][]>;
  walk: Record<Direction, number[][][]>;
}

export interface UserCommand {
  id: string;
  command: string;
  issuedAt: number;
  processedAt?: number;
  interpretation?: string;
  plannedActions?: Array<{
    action: string;
    timing: string;
    reason: string;
  }>;
}

export interface CharacterData {
  id: string;
  name: string;
  age: number;
  position: Position;
  color: string;
  sprite: CharacterSprite;
  direction: Direction;
  isMoving: boolean;

  // Identity
  personality: string;
  occupation: string;
  lifestyle: string;

  // Memory stream (the core of the architecture)
  memoryStream: Memory[];

  // Planning
  currentPlan: DailyPlan | null;
  currentAction: string;
  currentActionEmoji: string;

  // Social
  relationships: Record<string, Relationship>;

  // State
  lastReflectionTime: number;
  importanceAccumulator: number; // Triggers reflection when > threshold

  // User commands (inner voice)
  pendingCommands: UserCommand[];
}

// Template for creating characters (without runtime state)
export interface CharacterTemplate {
  id: string;
  name: string;
  age: number;
  color: string;
  personality: string;
  occupation: string;
  lifestyle: string;
  startPosition: Position;
  initialMemories: Array<{
    content: string;
    type: MemoryType;
  }>;
  initialRelationships: Record<string, {
    description: string;
    sentiment: number;
  }>;
}

// ============== CONVERSATION TYPES ==============

export interface ConversationMessage {
  speakerId: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: ConversationMessage[];
  startTime: number;
  endTime?: number;
  location: Position;
}

// ============== ENVIRONMENT TYPES ==============

export type EnvironmentNodeType = 'world' | 'area' | 'building' | 'room' | 'object';

export interface EnvironmentNode {
  name: string;
  type: EnvironmentNodeType;
  children?: EnvironmentNode[];
  state?: string; // e.g., "coffee machine is brewing"
  position?: Position;
}

export interface LocationBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// ============== OBSERVATION TYPES ==============

export interface Observation {
  subject: string;
  predicate: string;
  object: string;
  location: string;
  timestamp: number;
}

// ============== DIFFUSION TYPES ==============

export interface DiffusionEvent {
  id: string;
  originalMemoryId: string;
  originalContent: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  timestamp: number;
  context: string;
}

// ============== WORLD TYPES ==============

export interface WorldConfig {
  id: string;
  name: string;
  description: string;
  gridSize: { width: number; height: number };
  tileSize: number;
  startTime: GameTime;
}

export interface WorldState {
  config: WorldConfig;
  time: GameTime;
  characters: CharacterData[];
  conversations: Conversation[];
  environment: EnvironmentNode;
  diffusionLog: DiffusionEvent[];
  simulationLog: string[];
  createdAt: number;
  updatedAt: number;
}

// ============== MAP TYPES ==============

export type TileType = 
  | 'grass'
  | 'path'
  | 'water'
  | 'building'
  | 'floor'
  | 'wall'
  | 'door'
  | 'tree'
  | 'furniture';

export interface Tile {
  type: TileType;
  walkable: boolean;
  sprite?: number[][];
}

export interface MapData {
  width: number;
  height: number;
  tiles: TileType[][];
  locationBounds: Record<string, LocationBounds>;
}

// ============== EVENT TYPES ==============

export type GameEventType =
  | 'time:tick'
  | 'time:hour-changed'
  | 'time:day-changed'
  | 'time:paused'
  | 'time:resumed'
  | 'time:speed-changed'
  | 'character:moved'
  | 'character:action-changed'
  | 'character:added'
  | 'character:removed'
  | 'memory:added'
  | 'memory:reflection-triggered'
  | 'conversation:started'
  | 'conversation:message'
  | 'conversation:ended'
  | 'world:loaded'
  | 'world:saved'
  | 'world:reset';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
  timestamp: number;
}
