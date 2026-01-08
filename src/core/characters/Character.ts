/**
 * Character - Core character entity and management
 */

import type {
  CharacterData,
  CharacterTemplate,
  CharacterSprite,
  Position,
  Direction,
  Memory,
  DailyPlan,
  Relationship,
  UserCommand,
  GameTime,
} from '../types';
import { MemoryStream, createMemory } from '../agents/memory';
import { Planner, getDefaultRoutine, getPlanEmoji } from '../agents/planning';
import { EventBus } from '../events';

/**
 * Character class - represents a single character/agent in the simulation
 */
export class Character {
  private data: CharacterData;
  private memoryStream: MemoryStream;
  private planner: Planner;
  private eventBus: EventBus;

  constructor(data: CharacterData, eventBus: EventBus) {
    this.data = data;
    this.eventBus = eventBus;
    this.memoryStream = new MemoryStream(data.memoryStream);
    this.planner = new Planner(getDefaultRoutine);

    if (data.currentPlan) {
      this.planner.setDailyPlan(data.currentPlan);
    }
  }

  // ============== GETTERS ==============

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get age(): number {
    return this.data.age;
  }

  get position(): Position {
    return { ...this.data.position };
  }

  get color(): string {
    return this.data.color;
  }

  get sprite(): CharacterSprite {
    return this.data.sprite;
  }

  get direction(): Direction {
    return this.data.direction;
  }

  get isMoving(): boolean {
    return this.data.isMoving;
  }

  get personality(): string {
    return this.data.personality;
  }

  get occupation(): string {
    return this.data.occupation;
  }

  get lifestyle(): string {
    return this.data.lifestyle;
  }

  get currentAction(): string {
    return this.data.currentAction;
  }

  get currentActionEmoji(): string {
    return this.data.currentActionEmoji;
  }

  get relationships(): Record<string, Relationship> {
    return { ...this.data.relationships };
  }

  get pendingCommands(): UserCommand[] {
    return [...this.data.pendingCommands];
  }

  get lastReflectionTime(): number {
    return this.data.lastReflectionTime;
  }

  // ============== POSITION & MOVEMENT ==============

  setPosition(position: Position): void {
    const oldPosition = this.data.position;
    this.data.position = { ...position };
    this.eventBus.emit('character:moved', {
      characterId: this.id,
      oldPosition,
      newPosition: position,
    });
  }

  setDirection(direction: Direction): void {
    this.data.direction = direction;
  }

  setMoving(isMoving: boolean): void {
    this.data.isMoving = isMoving;
  }

  move(direction: Direction, gridSize: { width: number; height: number }): boolean {
    const newPosition = { ...this.data.position };

    switch (direction) {
      case 'up':
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case 'down':
        newPosition.y = Math.min(gridSize.height - 1, newPosition.y + 1);
        break;
      case 'left':
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case 'right':
        newPosition.x = Math.min(gridSize.width - 1, newPosition.x + 1);
        break;
    }

    // Check if position actually changed
    if (newPosition.x !== this.data.position.x || newPosition.y !== this.data.position.y) {
      this.setPosition(newPosition);
      this.setDirection(direction);
      return true;
    }

    this.setDirection(direction);
    return false;
  }

  // ============== ACTIONS ==============

  setAction(action: string, emoji?: string): void {
    this.data.currentAction = action;
    this.data.currentActionEmoji = emoji ?? getPlanEmoji(action);
    this.eventBus.emit('character:action-changed', {
      characterId: this.id,
      action,
      emoji: this.data.currentActionEmoji,
    });
  }

  // ============== MEMORY ==============

  getMemoryStream(): MemoryStream {
    return this.memoryStream;
  }

  addMemory(memory: Memory): void {
    this.memoryStream.add(memory);
    this.eventBus.emit('memory:added', {
      characterId: this.id,
      memory,
    });
  }

  addNewMemory(content: string, type: Memory['type'], options?: {
    importance?: number;
    pointers?: string[];
  }): Memory {
    const memory = createMemory(content, type, options);
    this.addMemory(memory);
    return memory;
  }

  shouldReflect(): boolean {
    return this.memoryStream.shouldReflect();
  }

  resetImportanceAccumulator(): void {
    this.memoryStream.resetImportanceAccumulator();
    this.data.lastReflectionTime = Date.now();
  }

  // ============== PLANNING ==============

  getPlanner(): Planner {
    return this.planner;
  }

  initializeDailyPlan(day: number): DailyPlan {
    const plan = this.planner.initializeDailyPlan(this.data.occupation, day);
    this.data.currentPlan = plan;
    return plan;
  }

  getCurrentPlan(time: GameTime): DailyPlan | null {
    return this.data.currentPlan;
  }

  updateActionFromPlan(time: GameTime): void {
    const { action, emoji } = this.planner.getCurrentAction(time);
    this.setAction(action, emoji);
  }

  // ============== RELATIONSHIPS ==============

  getRelationship(otherId: string): Relationship | undefined {
    return this.data.relationships[otherId];
  }

  updateRelationship(
    otherId: string,
    sentimentDelta: number,
    description?: string
  ): void {
    const existing = this.data.relationships[otherId];
    const newSentiment = Math.max(
      -1,
      Math.min(1, (existing?.sentiment ?? 0) + sentimentDelta)
    );

    this.data.relationships[otherId] = {
      characterId: otherId,
      description: description ?? existing?.description ?? 'Acquaintance',
      lastInteraction: Date.now(),
      sentiment: newSentiment,
    };
  }

  // ============== USER COMMANDS ==============

  addUserCommand(command: string): UserCommand {
    const newCommand: UserCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command,
      issuedAt: Date.now(),
    };
    this.data.pendingCommands.push(newCommand);
    return newCommand;
  }

  processUserCommand(commandId: string, interpretation?: string): void {
    const command = this.data.pendingCommands.find((c) => c.id === commandId);
    if (command) {
      command.processedAt = Date.now();
      command.interpretation = interpretation;
    }
  }

  getUnprocessedCommands(): UserCommand[] {
    return this.data.pendingCommands.filter((c) => !c.processedAt);
  }

  // ============== SERIALIZATION ==============

  serialize(): CharacterData {
    return {
      ...this.data,
      memoryStream: this.memoryStream.getAll(),
      currentPlan: this.planner.getDailyPlan(),
    };
  }

  static deserialize(data: CharacterData, eventBus: EventBus): Character {
    return new Character(data, eventBus);
  }

  // ============== SUMMARY ==============

  getSummary(includeMemories: boolean = false): string {
    const parts: string[] = [
      `Name: ${this.name}`,
      `Age: ${this.age}`,
      `Occupation: ${this.occupation}`,
      `Personality: ${this.personality}`,
      `Current Action: ${this.currentAction}`,
    ];

    if (includeMemories) {
      const recentMemories = this.memoryStream.getRecent(5);
      if (recentMemories.length > 0) {
        parts.push('\nRecent Memories:');
        recentMemories.forEach((m) => {
          parts.push(`- ${m.content}`);
        });
      }
    }

    return parts.join('\n');
  }

  getBriefSummary(): string {
    return `${this.name} is a ${this.age}-year-old ${this.occupation}. ${this.personality.split('.')[0]}.`;
  }
}

/**
 * Create a character from a template
 */
export function createCharacterFromTemplate(
  template: CharacterTemplate,
  sprite: CharacterSprite,
  eventBus: EventBus
): Character {
  const now = Date.now();

  // Convert initial memories
  const memories = template.initialMemories.map((m) =>
    createMemory(m.content, m.type)
  );

  // Convert initial relationships
  const relationships: Record<string, Relationship> = {};
  Object.entries(template.initialRelationships).forEach(([id, rel]) => {
    relationships[id] = {
      characterId: id,
      description: rel.description,
      lastInteraction: now - Math.random() * 259200000, // Random time in last 3 days
      sentiment: rel.sentiment,
    };
  });

  const data: CharacterData = {
    id: template.id,
    name: template.name,
    age: template.age,
    position: { ...template.startPosition },
    color: template.color,
    sprite,
    direction: 'down',
    isMoving: false,
    personality: template.personality,
    occupation: template.occupation,
    lifestyle: template.lifestyle,
    memoryStream: memories,
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🌅',
    relationships,
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  return new Character(data, eventBus);
}
