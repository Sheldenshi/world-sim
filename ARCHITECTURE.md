# Architecture Guide

This document describes the modular architecture of the Generative Agents simulation engine.

## Overview

The codebase is organized into three main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│    (components, store, pages)                           │
├─────────────────────────────────────────────────────────┤
│                    Templates Layer                       │
│    (big-bang-theory, future templates...)               │
├─────────────────────────────────────────────────────────┤
│                    Core Engine                           │
│    (framework-agnostic, pure TypeScript)                │
└─────────────────────────────────────────────────────────┘
```

## Core Engine (`src/core/`)

The core engine is **framework-agnostic** - it has no React dependencies and can be used with any frontend framework or even in a Node.js backend.

### Module Overview

```
core/
├── types.ts              # All shared type definitions
├── index.ts              # Public API exports
│
├── events/               # Event System
│   └── EventBus.ts       # Pub/sub for loose coupling
│
├── time/                 # Time Management
│   └── TimeSystem.ts     # Game clock, speed, pause
│
├── agents/               # Agent Behavior
│   ├── memory/           # Memory stream & retrieval
│   ├── planning/         # Daily planning system
│   └── social/           # Conversations
│
├── characters/           # Character Management
│   ├── Character.ts      # Character entity
│   └── CharacterManager.ts
│
├── map/                  # Spatial Systems
│   └── GameMap.ts        # Grid + pathfinding
│
├── environment/          # World Environment
│   └── Environment.ts    # Location hierarchy
│
├── world/                # Orchestration
│   └── World.ts          # Main World class
│
└── persistence/          # Save/Load
    ├── types.ts          # StorageAdapter interface
    ├── LocalStorageAdapter.ts
    └── WorldManager.ts
```

### EventBus

The EventBus enables loose coupling between modules. Any module can emit or listen to events without direct dependencies.

```typescript
import { EventBus } from '@/core/events';

const eventBus = new EventBus();

// Subscribe to events
const unsubscribe = eventBus.on('time:hour-changed', (event) => {
  console.log(`Hour: ${event.payload.newHour}`);
});

// Emit events
eventBus.emit('character:moved', {
  characterId: 'sheldon',
  oldPosition: { x: 4, y: 7 },
  newPosition: { x: 5, y: 7 },
});

// Unsubscribe when done
unsubscribe();
```

**Event Types:**
- `time:tick`, `time:hour-changed`, `time:day-changed`, `time:paused`, `time:resumed`
- `character:moved`, `character:action-changed`, `character:added`, `character:removed`
- `memory:added`, `memory:reflection-triggered`
- `conversation:started`, `conversation:message`, `conversation:ended`
- `world:loaded`, `world:saved`, `world:reset`

### TimeSystem

Manages game time progression with configurable speed.

```typescript
import { TimeSystem } from '@/core/time';

const time = new TimeSystem(eventBus, {
  initialTime: { day: 1, hour: 8, minute: 0, speed: 1, isPaused: false },
  tickIntervalMs: 1000, // 1 real second = 1 game minute
});

time.start();           // Start auto-ticking
time.pause();           // Pause
time.resume();          // Resume
time.setSpeed(5);       // 5x speed
time.tick();            // Manual tick

const gameTime = time.getTime();
const timeOfDay = time.getTimeOfDay(); // 'morning' | 'afternoon' | 'evening' | 'night'
```

### MemoryStream

Each character has a memory stream implementing the paper's retrieval algorithm.

```typescript
import { MemoryStream, createMemory } from '@/core/agents/memory';

const memories = new MemoryStream();

// Add memories
const memory = createMemory(
  "Leonard asked me about string theory",
  "conversation",
  { importance: 7 }
);
memories.add(memory);

// Retrieve relevant memories
const relevant = memories.retrieve(
  "What happened with Leonard?",  // query
  24,                             // game hours passed
  { recency: 1, importance: 1, relevance: 1.5 }, // weights
  10                              // top K
);

// Check if reflection needed
if (memories.shouldReflect()) {
  const questions = memories.generateReflectionQuestions();
  // Generate reflections via LLM...
  memories.resetImportanceAccumulator();
}
```

**Retrieval Scoring:**
- **Recency**: Exponential decay based on time since last access
- **Importance**: 1-10 scale based on event significance
- **Relevance**: Word overlap similarity (embeddings in production)

### Planner

Hierarchical planning system with three levels of granularity.

```typescript
import { Planner, getDefaultRoutine } from '@/core/agents/planning';

const planner = new Planner(getDefaultRoutine);

// Initialize daily plan
const dailyPlan = planner.initializeDailyPlan('Theoretical Physicist', 1);
// dailyPlan.broadStrokes  - 5-8 chunks (e.g., "Work at Caltech")
// dailyPlan.hourlyPlans   - Hourly breakdown
// dailyPlan.detailedPlans - 5-15 minute actions

// Get current action
const { action, emoji } = planner.getCurrentAction(time.getTime());
```

### Character

Character entity encapsulating identity, memory, planning, and relationships.

```typescript
import { Character, createCharacterFromTemplate } from '@/core/characters';

const character = createCharacterFromTemplate(sheldonTemplate, sprite, eventBus);

// Access properties
character.id;           // 'sheldon'
character.name;         // 'Sheldon Cooper'
character.position;     // { x: 4, y: 7 }
character.currentAction;// 'Working on string theory'

// Memory operations
character.addNewMemory("Penny knocked three times", "observation");
const stream = character.getMemoryStream();

// Movement
character.move('right', gridSize);
character.setPosition({ x: 5, y: 7 });

// Relationships
character.updateRelationship('leonard', 0.1, 'Helped with research');

// User commands (inner voice)
character.addUserCommand("Go talk to Penny");
```

### CharacterManager

Manages all characters in the simulation.

```typescript
import { CharacterManager } from '@/core/characters';

const characters = new CharacterManager(eventBus);

characters.add(sheldon);
characters.get('sheldon');
characters.getAll();
characters.getNearby('sheldon', 5);  // Within 5 tiles
characters.isPositionOccupied({ x: 5, y: 7 });
characters.initializeDailyPlans(1);  // Day 1
```

### GameMap

Grid-based map with A* pathfinding.

```typescript
import { GameMap } from '@/core/map';

const map = new GameMap({
  width: 50,
  height: 28,
  tiles: [...],  // 2D array of TileType
  locationBounds: {
    'Apartment 4A': { minX: 2, maxX: 8, minY: 2, maxY: 10 },
    // ...
  },
});

map.isWalkable(5, 7);
map.getLocationFromPosition({ x: 5, y: 7 });  // 'Apartment 4A'

// Pathfinding
const path = map.findPath(
  { x: 4, y: 7 },           // from
  { x: 30, y: 5 },          // to (Caltech)
  [{ x: 10, y: 7 }]         // occupied positions to avoid
);
```

### Environment

Hierarchical spatial representation from the paper.

```typescript
import { Environment } from '@/core/environment';

const env = new Environment(environmentTree, locationBounds);

env.getLocationFromPosition({ x: 4, y: 7 });  // 'Apartment 4A'
env.getLocationPath({ x: 4, y: 7 });          // ['Pasadena', 'Residential', '2311 Los Robles', 'Apartment 4A']
env.getObjectsInLocation('Apartment 4A');     // [{ name: 'couch', state: "Sheldon's spot" }, ...]
env.describeEnvironment({ x: 4, y: 7 });      // Natural language description
```

### World

The main orchestrator that ties all systems together.

```typescript
import { World } from '@/core/world';
import { bigBangTheoryTemplate } from '@/templates';

// Create from template
const world = World.fromTemplate(bigBangTheoryTemplate);

// Access subsystems
world.time          // TimeSystem
world.characters    // CharacterManager
world.conversations // ConversationManager
world.environment   // Environment
world.map          // GameMap
world.eventBus     // EventBus

// Control
world.start();
world.pause();
world.setSpeed(5);

// Logging
world.addToLog("Something happened");
const log = world.getLog();

// Serialization
const state = world.serialize();
world.loadState(state);
```

### Persistence

Save/load system with pluggable storage adapters.

```typescript
import { WorldManager, LocalStorageAdapter } from '@/core/persistence';

// Using default localStorage
const manager = new WorldManager();

// Or with custom adapter
const manager = new WorldManager(new MyDatabaseAdapter());

// Register templates
manager.registerTemplate(bigBangTheoryTemplate);

// Create world
const world = manager.createWorld('big-bang-theory');

// Save
await manager.saveCurrentWorld();

// List saved
const saved = await manager.listSavedWorlds();

// Load
const loaded = await manager.loadWorld(worldId, bigBangTheoryTemplate);

// Export/Import JSON
const json = manager.exportWorldAsJson(world);
const imported = manager.importWorldFromJson(json, template);
```

**Custom Storage Adapter:**

```typescript
import { StorageAdapter, WorldMetadata, WorldState } from '@/core/persistence';

class PostgresAdapter implements StorageAdapter {
  async save(worldId: string, state: WorldState): Promise<void> {
    // Save to PostgreSQL
  }
  
  async load(worldId: string): Promise<WorldState | null> {
    // Load from PostgreSQL
  }
  
  async delete(worldId: string): Promise<boolean> {
    // Delete from PostgreSQL
  }
  
  async list(): Promise<WorldMetadata[]> {
    // List all worlds
  }
  
  async exists(worldId: string): Promise<boolean> {
    // Check existence
  }
}
```

## Templates (`src/templates/`)

Templates define complete world configurations.

```typescript
// src/templates/my-world/index.ts
import type { WorldTemplate } from '@/core/world';
import type { CharacterTemplate, EnvironmentNode, LocationBounds } from '@/core/types';

export const myWorldTemplate: WorldTemplate = {
  id: 'my-world',
  name: 'My Custom World',
  description: 'Description for UI',
  
  gridSize: { width: 50, height: 28 },
  tileSize: 16,
  
  startTime: {
    day: 1,
    hour: 8,
    minute: 0,
    speed: 1,
    isPaused: false,
  },
  
  characters: [
    {
      id: 'character-1',
      name: 'Character One',
      age: 30,
      color: '#3B82F6',
      startPosition: { x: 10, y: 10 },
      personality: 'Friendly and outgoing...',
      occupation: 'Teacher',
      lifestyle: 'Works at school...',
      initialMemories: [
        { content: 'I am a teacher', type: 'observation' },
      ],
      initialRelationships: {
        'character-2': { description: 'Colleague', sentiment: 0.5 },
      },
    },
    // More characters...
  ],
  
  environment: {
    tree: {
      name: 'My Town',
      type: 'world',
      children: [
        {
          name: 'School',
          type: 'building',
          position: { x: 10, y: 10 },
          children: [
            { name: 'Classroom', type: 'room', children: [...] },
          ],
        },
      ],
    },
    locationBounds: {
      'School': { minX: 5, maxX: 15, minY: 5, maxY: 15 },
    },
  },
  
  spriteGenerator: (color, characterId) => {
    // Return CharacterSprite with pixel art data
    return createCharacterSprites(color);
  },
};
```

## React Integration (`src/store/`)

The Zustand store bridges React with the core engine.

```typescript
// Current approach: Store wraps core functionality
// Components use store, store uses core modules

// Future approach: Store could hold World instance
interface GameStore {
  world: World | null;
  initializeWorld: (templateId: string) => void;
  // ... actions delegate to world methods
}
```

## Future Considerations

### Extracting to Separate Backend

The core engine can be extracted to run on a separate Bun/Node.js server:

```
┌─────────────────┐     WebSocket/HTTP     ┌─────────────────┐
│  React Frontend │ ◄──────────────────►   │   Bun Backend   │
│                 │                         │                 │
│  - Components   │                         │  - Core Engine  │
│  - UI State     │                         │  - AI Calls     │
│                 │                         │  - Persistence  │
└─────────────────┘                         └─────────────────┘
```

### Adding New Features

1. **New Event Types**: Add to `GameEventType` in `types.ts`
2. **New Memory Types**: Add to `MemoryType` in `types.ts`
3. **New Character Behaviors**: Extend `Character` class or create new agent modules
4. **New Storage Backends**: Implement `StorageAdapter` interface

### Testing

The core engine's framework-agnostic design makes it easy to unit test:

```typescript
import { World } from '@/core';
import { bigBangTheoryTemplate } from '@/templates';

describe('World', () => {
  it('should initialize characters', () => {
    const world = World.fromTemplate(bigBangTheoryTemplate);
    expect(world.characters.count).toBe(6);
  });
  
  it('should advance time', () => {
    const world = World.fromTemplate(bigBangTheoryTemplate);
    world.tick();
    expect(world.time.getTime().minute).toBe(1);
  });
});
```
