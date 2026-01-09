# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Generative Agents simulation based on the Stanford paper "Generative Agents: Interactive Simulacra of Human Behavior". A Next.js 16 app featuring Big Bang Theory characters in a Pokémon-style pixel art world with AI-powered conversations, memory, and planning.

## Commands

```bash
bun install          # Install dependencies (uses Bun, not npm)
bun run dev          # Start development server on localhost:3000
bun run build        # Build for production
bun run lint         # Run Next.js linter
```

## Environment Setup

Requires `OPENAI_API_KEY` in `.env.local` for AI features. Mock fallbacks exist if no key is set.

## Architecture

Three-layer architecture:

1. **React Frontend** (`src/components/`, `src/store/`) - UI components and Zustand state
2. **Templates** (`src/templates/`) - World configuration (characters, environment, locations)
3. **Core Engine** (`src/core/`) - Framework-agnostic pure TypeScript simulation logic

### Core Engine (`src/core/`)

The core is designed with zero React dependencies for portability:

- `World.ts` - Main orchestrator, ties all systems together
- `EventBus.ts` - Pub/sub system (events: `time:*`, `character:*`, `memory:*`, `conversation:*`, `world:*`)
- `TimeSystem.ts` - Game clock with speed control and pause
- `MemoryStream.ts` - Memory storage and retrieval (recency/importance/relevance scoring)
- `Planner.ts` - Three-level hierarchical planning (broad strokes → hourly → detailed)
- `Character.ts` / `CharacterManager.ts` - Character entities and collection management
- `GameMap.ts` - 50x28 grid with A* pathfinding
- `Environment.ts` - Hierarchical location system
- `WorldManager.ts` - Save/load with pluggable `StorageAdapter` interface

### API Routes (`src/app/api/`)

All use GPT-4o-mini:
- `/api/chat` - Character dialogue
- `/api/reflect` - Generate reflections from memories
- `/api/plan` - Daily plan generation
- `/api/replan` - Reactive replanning
- `/api/decide` - Movement decisions
- `/api/interview` - Interview characters
- `/api/command` - User "inner voice" commands

### State Management

`src/store/gameStore.ts` - Zustand store bridging React components with core engine state (characters, time, conversations, log).

### Key Files

- `src/lib/sprites.ts` - Pixel art sprite generation (~27K lines)
- `src/templates/big-bang-theory/` - Default world template with 6 characters
- `src/core/types.ts` - All core type definitions

## Creating New World Templates

Add a new directory in `src/templates/` implementing `WorldTemplate`:

```typescript
export const myTemplate: WorldTemplate = {
  id: 'my-world',
  name: 'My World',
  gridSize: { width: 50, height: 28 },
  tileSize: 16,
  startTime: { day: 1, hour: 8, minute: 0, speed: 1, isPaused: false },
  characters: [...],      // CharacterTemplate[]
  environment: { tree, locationBounds },
  spriteGenerator: (color, id) => createSprite(color, id),
};
```

## Custom Storage Backends

Implement `StorageAdapter` interface in `src/core/persistence/types.ts` for database support (PostgreSQL, SQLite, etc.).
