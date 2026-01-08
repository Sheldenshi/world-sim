/**
 * MemoryStream - Core memory management for generative agents
 * Based on the paper's memory stream architecture
 */

import type { Memory, MemoryType, RetrievalWeights, DiffusionEvent } from '../../types';

const REFLECTION_THRESHOLD = 150;
const RECENCY_DECAY = 0.995;

/**
 * Generate a unique memory ID
 */
function generateMemoryId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Estimate importance of a memory content (1-10 scale)
 * In production, this would be done via LLM
 */
export function estimateImportance(content: string): number {
  const highImportanceKeywords = [
    'love', 'hate', 'angry', 'happy', 'sad', 'excited',
    'important', 'decided', 'learned', 'realized', 'discovered',
    'party', 'event', 'meeting', 'election', 'birthday',
    'relationship', 'friend', 'enemy', 'crush'
  ];

  const lowImportanceKeywords = [
    'walked', 'standing', 'sitting', 'idle', 'waiting',
    'routine', 'usual', 'normal', 'everyday'
  ];

  const lowerContent = content.toLowerCase();

  let score = 5; // Base score

  highImportanceKeywords.forEach((keyword) => {
    if (lowerContent.includes(keyword)) score += 1;
  });

  lowImportanceKeywords.forEach((keyword) => {
    if (lowerContent.includes(keyword)) score -= 0.5;
  });

  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Create a new memory entry
 */
export function createMemory(
  content: string,
  type: MemoryType,
  options?: {
    importance?: number;
    pointers?: string[];
    sourceCharacterId?: string;
    originalMemoryId?: string;
  }
): Memory {
  const now = Date.now();
  return {
    id: generateMemoryId(),
    content,
    createdAt: now,
    lastAccessedAt: now,
    importance: options?.importance ?? estimateImportance(content),
    type,
    pointers: options?.pointers,
    sourceCharacterId: options?.sourceCharacterId,
    originalMemoryId: options?.originalMemoryId,
    diffusedTo: [],
  };
}

/**
 * MemoryStream class - manages a character's memory stream
 */
export class MemoryStream {
  private memories: Memory[] = [];
  private importanceAccumulator: number = 0;
  private diffusionLog: DiffusionEvent[] = [];

  constructor(initialMemories: Memory[] = []) {
    this.memories = [...initialMemories];
    this.importanceAccumulator = 0;
  }

  /**
   * Add a memory to the stream
   */
  add(memory: Memory): void {
    this.memories.push(memory);
    this.importanceAccumulator += memory.importance;
  }

  /**
   * Add multiple memories
   */
  addMany(memories: Memory[]): void {
    memories.forEach((m) => this.add(m));
  }

  /**
   * Create and add a new memory
   */
  addNew(content: string, type: MemoryType, options?: {
    importance?: number;
    pointers?: string[];
    sourceCharacterId?: string;
    originalMemoryId?: string;
  }): Memory {
    const memory = createMemory(content, type, options);
    this.add(memory);
    return memory;
  }

  /**
   * Get all memories
   */
  getAll(): Memory[] {
    return [...this.memories];
  }

  /**
   * Get memory by ID
   */
  getById(id: string): Memory | undefined {
    return this.memories.find((m) => m.id === id);
  }

  /**
   * Get memories by type
   */
  getByType(type: MemoryType): Memory[] {
    return this.memories.filter((m) => m.type === type);
  }

  /**
   * Get recent memories
   */
  getRecent(count: number): Memory[] {
    return this.memories.slice(-count);
  }

  /**
   * Calculate recency score (exponential decay)
   */
  private calculateRecency(memory: Memory, gameHoursPassed: number): number {
    return Math.pow(RECENCY_DECAY, gameHoursPassed);
  }

  /**
   * Calculate relevance score using word overlap (simplified)
   * In production, this would use embeddings
   */
  private calculateRelevance(memory: Memory, query: string): number {
    const memoryWords = new Set(
      memory.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    );
    const queryWords = new Set(
      query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    );

    if (memoryWords.size === 0 || queryWords.size === 0) return 0;

    let overlap = 0;
    queryWords.forEach((word) => {
      if (memoryWords.has(word)) overlap++;
    });

    return overlap / Math.sqrt(memoryWords.size * queryWords.size);
  }

  /**
   * Normalize scores to [0, 1] range
   */
  private normalizeScores(scores: number[]): number[] {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    if (max === min) return scores.map(() => 1);
    return scores.map((s) => (s - min) / (max - min));
  }

  /**
   * Retrieve memories based on recency, importance, and relevance
   */
  retrieve(
    query: string,
    gameHoursPassed: number = 24,
    weights: RetrievalWeights = { recency: 1, importance: 1, relevance: 1 },
    topK: number = 10
  ): Memory[] {
    if (this.memories.length === 0) return [];

    // Calculate raw scores
    const recencyScores = this.memories.map((m) =>
      this.calculateRecency(m, gameHoursPassed)
    );
    const importanceScores = this.memories.map((m) => m.importance / 10);
    const relevanceScores = this.memories.map((m) =>
      this.calculateRelevance(m, query)
    );

    // Normalize scores
    const normRecency = this.normalizeScores(recencyScores);
    const normImportance = this.normalizeScores(importanceScores);
    const normRelevance = this.normalizeScores(relevanceScores);

    // Calculate final scores
    const finalScores = this.memories.map((_, i) =>
      weights.recency * normRecency[i] +
      weights.importance * normImportance[i] +
      weights.relevance * normRelevance[i]
    );

    // Sort by score and return top K
    const indexed = this.memories.map((m, i) => ({
      memory: m,
      score: finalScores[i],
    }));
    indexed.sort((a, b) => b.score - a.score);

    // Update last accessed time
    const results = indexed.slice(0, topK).map((item) => {
      item.memory.lastAccessedAt = Date.now();
      return item.memory;
    });

    return results;
  }

  /**
   * Check if reflection should be triggered
   */
  shouldReflect(): boolean {
    return this.importanceAccumulator >= REFLECTION_THRESHOLD;
  }

  /**
   * Reset importance accumulator after reflection
   */
  resetImportanceAccumulator(): void {
    this.importanceAccumulator = 0;
  }

  /**
   * Get importance accumulator value
   */
  getImportanceAccumulator(): number {
    return this.importanceAccumulator;
  }

  /**
   * Generate reflection questions based on recent memories
   */
  generateReflectionQuestions(): string[] {
    const recent = this.memories.slice(-100);

    // Extract subjects and themes
    const subjects = new Set<string>();
    recent.forEach((m) => {
      const words = m.content.split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3 && w[0] === w[0].toUpperCase()) {
          subjects.add(w);
        }
      });
    });

    const questions: string[] = [];
    subjects.forEach((subject) => {
      questions.push(`What is ${subject}'s relationship with me?`);
      questions.push(`What have I learned about ${subject}?`);
    });

    questions.push('What are my most important recent experiences?');
    questions.push('What patterns have I noticed in my daily life?');
    questions.push('What goals am I working towards?');

    return questions.slice(0, 5);
  }

  /**
   * Get time-relevant memories
   */
  getTimeRelevant(hour: number): Memory[] {
    const timeKeywords = this.getTimeKeywords(hour);
    return this.memories.filter((m) =>
      timeKeywords.some((kw) => m.content.toLowerCase().includes(kw))
    );
  }

  private getTimeKeywords(hour: number): string[] {
    if (hour >= 5 && hour < 9) return ['morning', 'wake', 'breakfast', 'routine'];
    if (hour >= 9 && hour < 12) return ['work', 'morning', 'start'];
    if (hour >= 12 && hour < 14) return ['lunch', 'noon', 'midday'];
    if (hour >= 14 && hour < 17) return ['afternoon', 'work'];
    if (hour >= 17 && hour < 20) return ['evening', 'dinner', 'home'];
    if (hour >= 20 && hour < 23) return ['night', 'relax', 'bed'];
    return ['night', 'sleep'];
  }

  /**
   * Format memories for LLM context
   */
  formatForContext(memories?: Memory[]): string {
    const mems = memories ?? this.memories;
    return mems.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
  }

  /**
   * Find shareable memories (gossip-worthy)
   */
  findShareable(targetCharacterId: string, topK: number = 3): Memory[] {
    const socialKeywords = [
      'said', 'told', 'heard', 'party', 'event', 'news',
      'happened', 'discovered', 'learned', 'relationship',
      'dating', 'broke up', 'angry', 'happy', 'excited'
    ];

    return this.memories
      .filter((m) => {
        if (m.importance < 5) return false;
        if (m.diffusedTo?.includes(targetCharacterId)) return false;
        const lowerContent = m.content.toLowerCase();
        const hasSocialContent = socialKeywords.some((kw) => lowerContent.includes(kw));
        return hasSocialContent || m.importance >= 7;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, topK);
  }

  /**
   * Check if character already knows information
   */
  knowsInformation(informationContent: string): boolean {
    const lowerContent = informationContent.toLowerCase();
    return this.memories.some((m) => {
      const memContent = m.content.toLowerCase();
      const contentWords = new Set(lowerContent.split(/\s+/).filter((w) => w.length > 3));
      const memWords = memContent.split(/\s+/).filter((w) => w.length > 3);
      const overlap = memWords.filter((w) => contentWords.has(w)).length;
      return overlap >= 3 || memContent.includes(lowerContent.slice(0, 30));
    });
  }

  /**
   * Record diffusion event
   */
  recordDiffusion(
    originalMemory: Memory,
    sourceCharacterId: string,
    targetCharacterId: string,
    context: string
  ): DiffusionEvent {
    const event: DiffusionEvent = {
      id: `diff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalMemoryId: originalMemory.id,
      originalContent: originalMemory.content,
      sourceCharacterId,
      targetCharacterId,
      timestamp: Date.now(),
      context,
    };

    this.diffusionLog.push(event);

    // Mark memory as shared
    if (!originalMemory.diffusedTo) {
      originalMemory.diffusedTo = [];
    }
    originalMemory.diffusedTo.push(targetCharacterId);

    return event;
  }

  /**
   * Get diffusion log
   */
  getDiffusionLog(): DiffusionEvent[] {
    return [...this.diffusionLog];
  }

  /**
   * Serialize memory stream
   */
  serialize(): { memories: Memory[]; importanceAccumulator: number; diffusionLog: DiffusionEvent[] } {
    return {
      memories: this.memories,
      importanceAccumulator: this.importanceAccumulator,
      diffusionLog: this.diffusionLog,
    };
  }

  /**
   * Deserialize and restore memory stream
   */
  static deserialize(data: {
    memories: Memory[];
    importanceAccumulator: number;
    diffusionLog: DiffusionEvent[];
  }): MemoryStream {
    const stream = new MemoryStream(data.memories);
    stream.importanceAccumulator = data.importanceAccumulator;
    stream.diffusionLog = data.diffusionLog;
    return stream;
  }

  /**
   * Get memory count
   */
  get length(): number {
    return this.memories.length;
  }
}
