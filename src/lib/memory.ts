import type { Memory, Character, GameTime, RetrievalWeights, DiffusionEvent } from "@/types";

const REFLECTION_THRESHOLD = 150; // Sum of importance scores to trigger reflection
const RECENCY_DECAY = 0.995; // Exponential decay factor

// Global information diffusion log
export const diffusionLog: DiffusionEvent[] = [];

// Calculate recency score (exponential decay)
export function calculateRecency(
  memory: Memory,
  currentTime: number,
  gameHoursPassed: number
): number {
  const hoursSinceAccess = gameHoursPassed;
  return Math.pow(RECENCY_DECAY, hoursSinceAccess);
}

// Normalize scores to [0, 1] range using min-max scaling
export function normalizeScores(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  if (max === min) return scores.map(() => 1);
  return scores.map((s) => (s - min) / (max - min));
}

// Calculate importance score (1-10 scale)
// In production, this would be done via LLM
export function estimateImportance(content: string): number {
  // Keywords that indicate higher importance
  const highImportanceKeywords = [
    "love", "hate", "angry", "happy", "sad", "excited",
    "important", "decided", "learned", "realized", "discovered",
    "party", "event", "meeting", "election", "birthday",
    "relationship", "friend", "enemy", "crush"
  ];
  
  const lowImportanceKeywords = [
    "walked", "standing", "sitting", "idle", "waiting",
    "routine", "usual", "normal", "everyday"
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

// Simple cosine similarity for relevance (using word overlap as proxy)
// In production, this would use embeddings
export function calculateRelevance(memory: Memory, query: string): number {
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

// Main retrieval function
export function retrieveMemories(
  memories: Memory[],
  query: string,
  currentTime: number,
  gameHoursPassed: number,
  weights: RetrievalWeights = { recency: 1, importance: 1, relevance: 1 },
  topK: number = 10
): Memory[] {
  if (memories.length === 0) return [];
  
  // Calculate raw scores
  const recencyScores = memories.map((m) =>
    calculateRecency(m, currentTime, gameHoursPassed)
  );
  const importanceScores = memories.map((m) => m.importance / 10);
  const relevanceScores = memories.map((m) => calculateRelevance(m, query));
  
  // Normalize scores
  const normRecency = normalizeScores(recencyScores);
  const normImportance = normalizeScores(importanceScores);
  const normRelevance = normalizeScores(relevanceScores);
  
  // Calculate final scores
  const finalScores = memories.map((_, i) =>
    weights.recency * normRecency[i] +
    weights.importance * normImportance[i] +
    weights.relevance * normRelevance[i]
  );
  
  // Sort by score and return top K
  const indexed = memories.map((m, i) => ({ memory: m, score: finalScores[i] }));
  indexed.sort((a, b) => b.score - a.score);
  
  return indexed.slice(0, topK).map((item) => item.memory);
}

// Check if reflection should be triggered
export function shouldReflect(character: Character): boolean {
  return character.importanceAccumulator >= REFLECTION_THRESHOLD;
}

// Generate reflection questions based on recent memories
export function generateReflectionQuestions(memories: Memory[]): string[] {
  // Get most recent memories
  const recent = memories.slice(-100);
  
  // Extract subjects and themes (simplified)
  const subjects = new Set<string>();
  recent.forEach((m) => {
    // Extract potential subjects (names, topics)
    const words = m.content.split(/\s+/);
    words.forEach((w) => {
      if (w.length > 3 && w[0] === w[0].toUpperCase()) {
        subjects.add(w);
      }
    });
  });
  
  // Generate questions about the subjects
  const questions: string[] = [];
  subjects.forEach((subject) => {
    questions.push(`What is ${subject}'s relationship with me?`);
    questions.push(`What have I learned about ${subject}?`);
  });
  
  // Add general questions
  questions.push("What are my most important recent experiences?");
  questions.push("What patterns have I noticed in my daily life?");
  questions.push("What goals am I working towards?");
  
  return questions.slice(0, 5); // Return top 5 questions
}

// Create a new memory entry
export function createMemory(
  content: string,
  type: Memory["type"],
  pointers?: string[]
): Memory {
  const now = Date.now();
  return {
    id: `mem-${now}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    createdAt: now,
    lastAccessedAt: now,
    importance: estimateImportance(content),
    type,
    pointers,
  };
}

// Format memories for LLM context
export function formatMemoriesForContext(memories: Memory[]): string {
  return memories
    .map((m, i) => `${i + 1}. ${m.content}`)
    .join("\n");
}

// Get time-relevant memories (e.g., morning routine at 7am)
export function getTimeRelevantMemories(
  memories: Memory[],
  time: GameTime
): Memory[] {
  const timeKeywords = getTimeKeywords(time.hour);
  return memories.filter((m) =>
    timeKeywords.some((kw) => m.content.toLowerCase().includes(kw))
  );
}

function getTimeKeywords(hour: number): string[] {
  if (hour >= 5 && hour < 9) return ["morning", "wake", "breakfast", "routine"];
  if (hour >= 9 && hour < 12) return ["work", "morning", "start"];
  if (hour >= 12 && hour < 14) return ["lunch", "noon", "midday"];
  if (hour >= 14 && hour < 17) return ["afternoon", "work"];
  if (hour >= 17 && hour < 20) return ["evening", "dinner", "home"];
  if (hour >= 20 && hour < 23) return ["night", "relax", "bed"];
  return ["night", "sleep"];
}

// ===== INFORMATION DIFFUSION TRACKING =====

/**
 * Create a memory that contains information learned from another agent
 * This tracks information diffusion through the social network
 */
export function createDiffusedMemory(
  content: string,
  type: Memory["type"],
  sourceCharacterId: string,
  originalMemoryId?: string
): Memory {
  const now = Date.now();
  return {
    id: `mem-${now}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    createdAt: now,
    lastAccessedAt: now,
    importance: estimateImportance(content),
    type,
    sourceCharacterId,
    originalMemoryId,
    diffusedTo: [],
  };
}

/**
 * Record when information is shared between agents
 */
export function recordDiffusion(
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
  
  diffusionLog.push(event);
  return event;
}

/**
 * Get all diffusion events involving a specific memory
 */
export function getMemoryDiffusionHistory(memoryId: string): DiffusionEvent[] {
  return diffusionLog.filter(
    (e) => e.originalMemoryId === memoryId
  );
}

/**
 * Get all agents who have received a piece of information
 */
export function getInformationSpread(originalMemoryId: string): string[] {
  const recipients = new Set<string>();
  diffusionLog
    .filter((e) => e.originalMemoryId === originalMemoryId)
    .forEach((e) => recipients.add(e.targetCharacterId));
  return Array.from(recipients);
}

/**
 * Check if an agent already knows a piece of information
 */
export function agentKnowsInformation(
  character: Character,
  informationContent: string
): boolean {
  // Check for exact match or similar content
  const lowerContent = informationContent.toLowerCase();
  return character.memoryStream.some((m) => {
    const memContent = m.content.toLowerCase();
    // Check for significant word overlap
    const contentWords = new Set(lowerContent.split(/\s+/).filter((w) => w.length > 3));
    const memWords = memContent.split(/\s+/).filter((w) => w.length > 3);
    const overlap = memWords.filter((w) => contentWords.has(w)).length;
    return overlap >= 3 || memContent.includes(lowerContent.slice(0, 30));
  });
}

/**
 * Find "gossip-worthy" memories that could be shared
 * Higher importance + social relevance = more likely to be shared
 */
export function findShareableMemories(
  character: Character,
  otherCharacterId: string,
  topK: number = 3
): Memory[] {
  // Find memories that:
  // 1. Have high importance
  // 2. Haven't been shared with this person yet
  // 3. Are about people or events (not routine observations)
  
  const socialKeywords = [
    "said", "told", "heard", "party", "event", "news",
    "happened", "discovered", "learned", "relationship",
    "dating", "broke up", "angry", "happy", "excited"
  ];
  
  const shareableMemories = character.memoryStream
    .filter((m) => {
      // Must be moderately important
      if (m.importance < 5) return false;
      
      // Must not have been shared with this person
      if (m.diffusedTo?.includes(otherCharacterId)) return false;
      
      // Should be social in nature
      const lowerContent = m.content.toLowerCase();
      const hasSocialContent = socialKeywords.some((kw) => lowerContent.includes(kw));
      
      return hasSocialContent || m.importance >= 7;
    })
    .sort((a, b) => b.importance - a.importance);
  
  return shareableMemories.slice(0, topK);
}

/**
 * Generate a summary of information diffusion for analytics
 */
export function getDiffusionSummary(): {
  totalEvents: number;
  uniqueInformation: number;
  mostDiffusedInfo: { content: string; count: number }[];
  mostConnectedAgents: { id: string; count: number }[];
} {
  const infoCount = new Map<string, { content: string; count: number }>();
  const agentCount = new Map<string, number>();
  
  diffusionLog.forEach((event) => {
    // Track info spread
    const existing = infoCount.get(event.originalMemoryId);
    if (existing) {
      existing.count++;
    } else {
      infoCount.set(event.originalMemoryId, { content: event.originalContent, count: 1 });
    }
    
    // Track agent participation
    agentCount.set(
      event.sourceCharacterId,
      (agentCount.get(event.sourceCharacterId) || 0) + 1
    );
    agentCount.set(
      event.targetCharacterId,
      (agentCount.get(event.targetCharacterId) || 0) + 1
    );
  });
  
  const mostDiffusedInfo = Array.from(infoCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const mostConnectedAgents = Array.from(agentCount.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalEvents: diffusionLog.length,
    uniqueInformation: infoCount.size,
    mostDiffusedInfo,
    mostConnectedAgents,
  };
}
