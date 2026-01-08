# Generative Agents - Interactive Simulacra

A simulation of believable human behavior using AI agents, inspired by the paper ["Generative Agents: Interactive Simulacra of Human Behavior"](https://arxiv.org/abs/2304.03442).

Set in Pasadena with characters from The Big Bang Theory (Season 1), this simulation features Sheldon, Leonard, Penny, Howard, Raj, and Stuart living their daily lives, forming memories, and having AI-powered conversations.

## Features

### Core Simulation
- **Memory Stream** - Characters form and retrieve memories based on recency, importance, and relevance
- **Reflection** - Higher-level insights generated from accumulated experiences
- **Planning** - Hierarchical daily schedules (broad strokes → hourly → detailed actions)
- **Conversations** - AI-powered dialogue with personality-consistent responses
- **Information Diffusion** - Gossip and information spread through the social network
- **User Commands** - "Inner voice" system to influence character behavior

### Frontend
- **Pokémon-style pixel art** - 16x16 character sprites with character-specific designs
- **Dynamic environment** - Day/night cycle, multiple locations (apartments, Caltech, Cheesecake Factory, Comic Store)
- **Real-time simulation** - Watch characters go about their daily routines
- **Multiple panels** - Chat, Interview, Memory Viewer, Voice Commands, Gossip Tracker

### World System (New!)
- **Modular architecture** - Core engine is framework-agnostic
- **World templates** - Create new simulation worlds easily
- **Save/Load** - Persist world state to localStorage (database support coming)
- **Multiple worlds** - Switch between different simulation scenarios

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **AI**: OpenAI GPT-4o-mini
- **Runtime**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd sim

# Install dependencies
bun install

# Set up environment variables
cp .env.local.example .env.local
# Add your OPENAI_API_KEY to .env.local

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the simulation.

## Environment Variables

Create a `.env.local` file with:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

## Project Structure

```
sim/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes for AI interactions
│   │   │   ├── chat/           # Character dialogue
│   │   │   ├── command/        # User command processing
│   │   │   ├── decide/         # Movement decisions
│   │   │   ├── interview/      # Character interviews
│   │   │   ├── plan/           # Planning generation
│   │   │   ├── reflect/        # Reflection generation
│   │   │   └── replan/         # Reactive replanning
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── core/                   # ⭐ MODULAR CORE ENGINE
│   │   ├── index.ts            # Public API exports
│   │   ├── types.ts            # Core type definitions
│   │   │
│   │   ├── events/             # Event system
│   │   │   └── EventBus.ts     # Pub/sub for loose coupling
│   │   │
│   │   ├── time/               # Time management
│   │   │   └── TimeSystem.ts   # Game time, speed, pause
│   │   │
│   │   ├── agents/             # Agent behavior modules
│   │   │   ├── memory/         # Memory stream & retrieval
│   │   │   ├── planning/       # Daily planning & routines
│   │   │   └── social/         # Conversations & relationships
│   │   │
│   │   ├── characters/         # Character management
│   │   │   ├── Character.ts    # Character entity
│   │   │   └── CharacterManager.ts
│   │   │
│   │   ├── map/                # Spatial systems
│   │   │   └── GameMap.ts      # Grid map & A* pathfinding
│   │   │
│   │   ├── environment/        # World environment
│   │   │   └── Environment.ts  # Location hierarchy
│   │   │
│   │   ├── world/              # World orchestration
│   │   │   └── World.ts        # Main orchestrator class
│   │   │
│   │   └── persistence/        # Save/Load system
│   │       ├── LocalStorageAdapter.ts
│   │       └── WorldManager.ts
│   │
│   ├── templates/              # World templates
│   │   ├── index.ts
│   │   └── big-bang-theory/    # BBT world template
│   │       ├── characters.ts   # Character definitions
│   │       ├── environment.ts  # Pasadena locations
│   │       └── index.ts
│   │
│   ├── components/             # React components
│   │   ├── GameCanvas.tsx      # Main game renderer
│   │   ├── TimeDisplay.tsx     # Time controls
│   │   ├── CharacterPanel.tsx  # Character info
│   │   ├── ConversationPanel.tsx
│   │   ├── InterviewPanel.tsx
│   │   ├── MemoryViewer.tsx
│   │   ├── UserCommandsPanel.tsx
│   │   ├── DiffusionViewer.tsx
│   │   └── SimulationLog.tsx
│   │
│   ├── lib/                    # Utilities (legacy, being migrated)
│   │   ├── agent.ts
│   │   ├── agentSummary.ts
│   │   ├── environment.ts
│   │   ├── memory.ts
│   │   ├── openai.ts
│   │   ├── planning.ts
│   │   ├── sprites.ts
│   │   └── time.ts
│   │
│   ├── store/                  # State management
│   │   └── gameStore.ts        # Zustand store
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── data/
│   └── worlds/                 # Saved world states
│
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### Core Engine

The simulation engine is designed to be **framework-agnostic**. The `src/core/` directory contains pure TypeScript with no React dependencies, making it:

- Easy to unit test
- Portable to other frontends (Vue, Svelte, etc.)
- Extractable to a separate backend service if needed

### Key Concepts

```typescript
// World is the main orchestrator
import { World, WorldManager } from '@/core';
import { bigBangTheoryTemplate } from '@/templates';

// Create a world from template
const world = World.fromTemplate(bigBangTheoryTemplate);

// Access subsystems
world.time          // TimeSystem - game clock
world.characters    // CharacterManager - all characters
world.conversations // ConversationManager - dialogues
world.environment   // Environment - locations
world.map           // GameMap - spatial grid
world.eventBus      // EventBus - pub/sub events

// Control simulation
world.start();      // Start auto-ticking
world.pause();      // Pause simulation
world.setSpeed(5);  // 5x speed

// Save/Load
const state = world.serialize();
world.loadState(state);
```

### Event System

Components communicate through events:

```typescript
world.eventBus.on('time:hour-changed', (event) => {
  console.log(`Hour changed to ${event.payload.newHour}`);
});

world.eventBus.on('conversation:started', (event) => {
  console.log(`${event.payload.participants.join(' and ')} are talking`);
});
```

### Memory System

Characters have a memory stream with retrieval based on:
- **Recency** - How recently the memory was accessed
- **Importance** - How significant the event was (1-10)
- **Relevance** - How related to the current context

```typescript
const memories = character.getMemoryStream().retrieve(
  "What do I know about Leonard?",
  24,  // hours passed
  { recency: 1, importance: 1, relevance: 1.5 },
  10   // top K results
);
```

### Creating New World Templates

```typescript
// src/templates/my-world/index.ts
import type { WorldTemplate } from '@/core/world';

export const myWorldTemplate: WorldTemplate = {
  id: 'my-world',
  name: 'My Custom World',
  description: 'A custom simulation world',
  gridSize: { width: 50, height: 28 },
  tileSize: 16,
  startTime: { day: 1, hour: 8, minute: 0, speed: 1, isPaused: false },
  characters: [
    // CharacterTemplate objects
  ],
  environment: {
    tree: { /* EnvironmentNode hierarchy */ },
    locationBounds: { /* Location rectangles */ },
  },
  spriteGenerator: (color, id) => createSprite(color, id),
};
```

## Characters

### The Big Bang Theory Cast

| Character | Occupation | Location | Personality |
|-----------|-----------|----------|-------------|
| **Sheldon Cooper** | Theoretical Physicist | Apartment 4A | Highly intelligent, socially inept, follows strict routines |
| **Leonard Hofstadter** | Experimental Physicist | Apartment 4A | Kind-hearted, insecure, hopeless romantic |
| **Penny** | Waitress / Aspiring Actress | Apartment 4B | Outgoing, street-smart, dreams of acting |
| **Howard Wolowitz** | Aerospace Engineer | Mom's House | Self-proclaimed ladies' man, lives with mother |
| **Raj Koothrappali** | Astrophysicist | His Apartment | Sweet, romantic, can't talk to women |
| **Stuart Bloom** | Comic Store Owner | Comic Store | Depressed, self-deprecating, artistic |

## Simulation Features

### Daily Planning
Characters follow occupation-specific daily routines:
- Wake up, morning routine
- Travel to work
- Work activities (research, serving customers, etc.)
- Lunch breaks
- Evening activities (video games, comic store visits)
- Sleep

### Conversations
Select two characters to start an AI-powered conversation. Characters:
- Reference their memories and relationships
- Stay in character based on personality
- Can share information (gossip spreading)
- Naturally end conversations

### Memory & Reflection
- Observations are stored with importance scores
- When importance accumulates past threshold, reflection is triggered
- Reflections generate higher-level insights
- All memories influence future behavior

### Information Diffusion
Track how gossip spreads through the social network:
- Who told whom what
- Which information spreads fastest
- Most connected characters

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat` | Generate character dialogue |
| `POST /api/reflect` | Generate reflections from memories |
| `POST /api/plan` | Generate daily plans |
| `POST /api/replan` | Reactive replanning |
| `POST /api/decide` | Movement decisions |
| `POST /api/interview` | Interview a character |
| `POST /api/command` | Process user commands |

## Future Enhancements

- [ ] World selection UI - Choose/create worlds from templates
- [ ] Database persistence - PostgreSQL/SQLite adapter
- [ ] More world templates (Medieval Village, Office, etc.)
- [ ] Character creator UI
- [ ] Map editor
- [ ] Multiplayer observation mode
- [ ] Mobile-responsive design

## References

- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442)
- [Original Paper Demo](https://reverie.herokuapp.com/UIST_Demo/)
- [Original Code Repository](https://github.com/joonspk-research/generative_agents)

## License

MIT
