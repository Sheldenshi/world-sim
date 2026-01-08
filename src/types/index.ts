export interface Position {
  x: number;
  y: number;
}

// Enhanced Memory type based on the paper
export interface Memory {
  id: string;
  content: string;
  createdAt: number;
  lastAccessedAt: number;
  importance: number; // 1-10 scale
  type: "observation" | "reflection" | "plan" | "conversation" | "command";
  embedding?: number[]; // For relevance calculation
  pointers?: string[]; // References to other memories (for reflections)
  // Information diffusion tracking
  sourceCharacterId?: string; // Who told us this information
  diffusedTo?: string[]; // Who we've shared this with
  originalMemoryId?: string; // If this is learned info, reference to original
}

// Plan structure from the paper
export interface Plan {
  id: string;
  description: string;
  startTime: { hour: number; minute: number };
  duration: number; // in minutes
  location?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  subPlans?: Plan[]; // Recursive decomposition
}

// Daily schedule
export interface DailyPlan {
  day: number;
  broadStrokes: Plan[]; // High-level plan (5-8 chunks)
  hourlyPlans: Plan[]; // Decomposed hourly
  detailedPlans: Plan[]; // 5-15 minute chunks
}

// Character with full agent architecture
export interface Character {
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

// User command (inner voice) - allows users to influence agent behavior
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

export interface Relationship {
  characterId: string;
  description: string;
  lastInteraction: number;
  sentiment: number; // -1 to 1
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: ConversationMessage[];
  startTime: number;
  endTime?: number;
  location: Position;
}

export interface ConversationMessage {
  speakerId: string;
  content: string;
  timestamp: number;
}

export type Direction = "up" | "down" | "left" | "right";

export interface CharacterSprite {
  idle: Record<Direction, number[][]>;
  walk: Record<Direction, number[][][]>;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  speed: number;
  isPaused: boolean;
}

// Environment representation as tree (from paper)
export interface EnvironmentNode {
  name: string;
  type: "world" | "area" | "building" | "room" | "object";
  children?: EnvironmentNode[];
  state?: string; // e.g., "coffee machine is brewing"
  position?: Position;
}

// Observation from the environment
export interface Observation {
  subject: string;
  predicate: string;
  object: string;
  location: string;
  timestamp: number;
}

export interface GameState {
  characters: Character[];
  time: GameTime;
  conversations: Conversation[];
  environment: EnvironmentNode;
  gridSize: { width: number; height: number };
  tileSize: number;
}

// Retrieval scoring weights
export interface RetrievalWeights {
  recency: number;
  importance: number;
  relevance: number;
}

// Information diffusion event - tracks how information spreads
export interface DiffusionEvent {
  id: string;
  originalMemoryId: string;
  originalContent: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  timestamp: number;
  context: string; // How the info was shared (conversation, observation, etc.)
}
