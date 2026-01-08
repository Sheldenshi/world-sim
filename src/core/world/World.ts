/**
 * World - The main orchestrator that ties all systems together
 */

import type {
  WorldConfig,
  WorldState,
  GameTime,
  CharacterData,
  CharacterTemplate,
  CharacterSprite,
  Conversation,
  EnvironmentNode,
  LocationBounds,
  DiffusionEvent,
  MapData,
} from '../types';
import { EventBus } from '../events';
import { TimeSystem } from '../time';
import { CharacterManager, createCharacterFromTemplate } from '../characters';
import { ConversationManager } from '../agents/social';
import { Environment } from '../environment';
import { GameMap } from '../map';

export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  gridSize: { width: number; height: number };
  tileSize: number;
  startTime: Partial<GameTime>;
  characters: CharacterTemplate[];
  environment: {
    tree: EnvironmentNode;
    locationBounds: Record<string, LocationBounds>;
  };
  mapData?: MapData;
  spriteGenerator: (color: string, characterId?: string) => CharacterSprite;
}

export class World {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gridSize: { width: number; height: number };
  readonly tileSize: number;

  readonly eventBus: EventBus;
  readonly time: TimeSystem;
  readonly characters: CharacterManager;
  readonly conversations: ConversationManager;
  readonly environment: Environment;
  readonly map: GameMap;

  private simulationLog: string[] = [];
  private diffusionLog: DiffusionEvent[] = [];
  private createdAt: number;
  private updatedAt: number;

  constructor(config: WorldConfig, template: WorldTemplate) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.gridSize = config.gridSize;
    this.tileSize = config.tileSize;

    this.createdAt = Date.now();
    this.updatedAt = Date.now();

    // Initialize event bus
    this.eventBus = new EventBus();

    // Initialize time system
    this.time = new TimeSystem(this.eventBus, {
      initialTime: config.startTime,
    });

    // Initialize character manager
    this.characters = new CharacterManager(this.eventBus);

    // Initialize conversation manager
    this.conversations = new ConversationManager(this.eventBus);

    // Initialize environment
    this.environment = new Environment(
      template.environment.tree,
      template.environment.locationBounds
    );

    // Initialize map
    if (template.mapData) {
      this.map = new GameMap(template.mapData);
    } else {
      this.map = GameMap.createEmpty(config.gridSize.width, config.gridSize.height);
    }

    // Create characters from template
    template.characters.forEach((charTemplate) => {
      const sprite = template.spriteGenerator(charTemplate.color, charTemplate.id);
      const character = createCharacterFromTemplate(charTemplate, sprite, this.eventBus);
      this.characters.add(character);
    });

    // Initialize daily plans
    this.characters.initializeDailyPlans(config.startTime.day ?? 1);

    // Set up event listeners
    this.setupEventListeners();

    this.addToLog('World initialized');
  }

  private setupEventListeners(): void {
    // Log time changes
    this.eventBus.on('time:day-changed', (event) => {
      const payload = event.payload as { newDay: number };
      this.addToLog(`Day ${payload.newDay} begins`);
      this.characters.initializeDailyPlans(payload.newDay);
    });

    // Update characters' actions on time tick
    this.eventBus.on('time:tick', () => {
      this.characters.updateActionsFromPlans(this.time.getTime());
    });

    // Log conversations
    this.eventBus.on('conversation:started', (event) => {
      const payload = event.payload as { participants: string[] };
      const names = payload.participants
        .map((id) => this.characters.get(id)?.name ?? id)
        .join(' and ');
      this.addToLog(`Conversation started between ${names}`);
    });

    this.eventBus.on('conversation:ended', () => {
      this.addToLog('Conversation ended');
    });
  }

  /**
   * Add message to simulation log
   */
  addToLog(message: string): void {
    const time = this.time.getTime();
    const timestamp = `Day ${time.day} ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    this.simulationLog.push(`[${timestamp}] ${message}`);

    // Keep log size manageable
    if (this.simulationLog.length > 1000) {
      this.simulationLog = this.simulationLog.slice(-500);
    }
  }

  /**
   * Get simulation log
   */
  getLog(): string[] {
    return [...this.simulationLog];
  }

  /**
   * Start the simulation
   */
  start(): void {
    this.time.start();
    this.eventBus.emit('world:loaded', { worldId: this.id });
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.time.stop();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.time.pause();
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    this.time.resume();
  }

  /**
   * Toggle pause
   */
  togglePause(): void {
    this.time.togglePause();
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    this.time.setSpeed(speed);
  }

  /**
   * Manual tick (for step-by-step simulation)
   */
  tick(): void {
    this.time.tick();
  }

  /**
   * Serialize world state
   */
  serialize(): WorldState {
    this.updatedAt = Date.now();

    return {
      config: {
        id: this.id,
        name: this.name,
        description: this.description,
        gridSize: this.gridSize,
        tileSize: this.tileSize,
        startTime: this.time.getTime(),
      },
      time: this.time.getTime(),
      characters: this.characters.serialize(),
      conversations: this.conversations.serialize(),
      environment: this.environment.getTree(),
      diffusionLog: this.diffusionLog,
      simulationLog: this.simulationLog,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Load state into world
   */
  loadState(state: WorldState): void {
    // Restore time
    this.time.deserialize(state.time);

    // Restore characters
    this.characters.deserialize(state.characters);

    // Restore conversations
    this.conversations.deserialize(state.conversations);

    // Restore logs
    this.diffusionLog = state.diffusionLog;
    this.simulationLog = state.simulationLog;

    this.createdAt = state.createdAt;
    this.updatedAt = state.updatedAt;

    this.eventBus.emit('world:loaded', { worldId: this.id });
  }

  /**
   * Reset world to initial state
   */
  reset(template: WorldTemplate): void {
    this.time.reset();
    this.characters.clear();
    this.conversations.clear();
    this.simulationLog = [];
    this.diffusionLog = [];

    // Re-create characters
    template.characters.forEach((charTemplate) => {
      const sprite = template.spriteGenerator(charTemplate.color, charTemplate.id);
      const character = createCharacterFromTemplate(charTemplate, sprite, this.eventBus);
      this.characters.add(character);
    });

    // Re-initialize plans
    this.characters.initializeDailyPlans(1);

    this.addToLog('World reset');
    this.eventBus.emit('world:reset', { worldId: this.id });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.eventBus.clear();
  }

  /**
   * Create a new world from template
   */
  static fromTemplate(template: WorldTemplate): World {
    const config: WorldConfig = {
      id: `world-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      gridSize: template.gridSize,
      tileSize: template.tileSize,
      startTime: {
        day: 1,
        hour: 8,
        minute: 0,
        speed: 1,
        isPaused: false,
        ...template.startTime,
      },
    };

    return new World(config, template);
  }
}
