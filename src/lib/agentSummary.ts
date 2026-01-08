/**
 * Agent Summary Description Generator
 * Based on the paper's approach to creating dynamic summaries for prompts
 * 
 * The summary includes:
 * 1. Basic identity (name, age, occupation)
 * 2. Core personality traits
 * 3. Current lifestyle and routines
 * 4. Key relationships
 * 5. Recent reflections and insights
 * 6. Current context (location, activity, time)
 */

import type { Character, Memory, GameTime } from "@/types";
import { getLocationFromPosition } from "./environment";

/**
 * Generate a comprehensive agent summary for LLM prompts
 */
export function generateAgentSummary(
  character: Character,
  time: GameTime,
  includeReflections: boolean = true,
  includeRelationships: boolean = true
): string {
  const parts: string[] = [];

  // 1. Basic Identity
  parts.push(
    `Name: ${character.name}`,
    `Age: ${character.age}`,
    `Occupation: ${character.occupation}`
  );

  // 2. Core Personality
  parts.push(`\nPersonality: ${character.personality}`);

  // 3. Lifestyle
  parts.push(`\nLifestyle: ${character.lifestyle}`);

  // 4. Current Context
  const location = getLocationFromPosition(character.position);
  parts.push(
    `\nCurrent Context:`,
    `- Location: ${location}`,
    `- Activity: ${character.currentAction}`,
    `- Time: Day ${time.day}, ${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`
  );

  // 5. Key Relationships
  if (includeRelationships && Object.keys(character.relationships).length > 0) {
    parts.push(`\nKey Relationships:`);
    Object.entries(character.relationships)
      .sort((a, b) => b[1].sentiment - a[1].sentiment) // Sort by sentiment
      .slice(0, 5) // Top 5 relationships
      .forEach(([_, rel]) => {
        const sentimentLabel = getSentimentLabel(rel.sentiment);
        parts.push(`- ${rel.description} (${sentimentLabel})`);
      });
  }

  // 6. Recent Reflections
  if (includeReflections) {
    const reflections = character.memoryStream
      .filter((m) => m.type === "reflection")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);

    if (reflections.length > 0) {
      parts.push(`\nRecent Insights:`);
      reflections.forEach((r) => {
        parts.push(`- ${r.content}`);
      });
    }
  }

  return parts.join("\n");
}

/**
 * Generate a brief summary for quick context (used in decisions)
 */
export function generateBriefSummary(character: Character): string {
  return `${character.name} is a ${character.age}-year-old ${character.occupation}. ${character.personality.split(".")[0]}.`;
}

/**
 * Generate a summary focused on social context
 */
export function generateSocialSummary(
  character: Character,
  otherCharacterIds: string[]
): string {
  const parts: string[] = [];

  parts.push(`${character.name} (${character.occupation})`);
  parts.push(`Personality: ${character.personality.split(".").slice(0, 2).join(".")}`);

  // Relationships with specific characters
  const relevantRelationships = otherCharacterIds
    .map((id) => character.relationships[id])
    .filter(Boolean);

  if (relevantRelationships.length > 0) {
    parts.push(`\nRelationships with present people:`);
    relevantRelationships.forEach((rel) => {
      parts.push(`- ${rel.description}`);
    });
  }

  return parts.join("\n");
}

/**
 * Generate a summary for planning context
 */
export function generatePlanningSummary(
  character: Character,
  time: GameTime
): string {
  const parts: string[] = [];

  parts.push(`${character.name}, ${character.occupation}`);
  parts.push(`\nDaily Routine: ${character.lifestyle}`);

  // Recent important memories
  const recentMemories = character.memoryStream
    .filter((m) => m.importance >= 5)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  if (recentMemories.length > 0) {
    parts.push(`\nRecent important experiences:`);
    recentMemories.forEach((m) => {
      parts.push(`- ${m.content}`);
    });
  }

  // Pending commands (inner voice)
  const pendingCommands = character.pendingCommands?.filter(
    (c) => !c.processedAt
  );
  if (pendingCommands && pendingCommands.length > 0) {
    parts.push(`\nInner thoughts urging action:`);
    pendingCommands.forEach((c) => {
      parts.push(`- "${c.command}"`);
    });
  }

  return parts.join("\n");
}

/**
 * Get sentiment label from numerical value
 */
function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 0.7) return "very positive";
  if (sentiment >= 0.4) return "positive";
  if (sentiment >= 0.1) return "friendly";
  if (sentiment >= -0.1) return "neutral";
  if (sentiment >= -0.4) return "somewhat negative";
  if (sentiment >= -0.7) return "negative";
  return "very negative";
}

/**
 * Extract key traits from personality description
 */
export function extractKeyTraits(personality: string): string[] {
  // Common trait indicators
  const traitIndicators = [
    "intelligent",
    "kind",
    "social",
    "introverted",
    "extroverted",
    "ambitious",
    "creative",
    "logical",
    "emotional",
    "confident",
    "insecure",
    "romantic",
    "practical",
    "idealistic",
    "cautious",
    "impulsive",
    "organized",
    "chaotic",
    "friendly",
    "reserved",
  ];

  const lowerPersonality = personality.toLowerCase();
  return traitIndicators.filter((trait) => lowerPersonality.includes(trait));
}

/**
 * Generate memories summary for context window management
 */
export function summarizeMemories(
  memories: Memory[],
  maxTokens: number = 500
): string {
  // Estimate ~4 chars per token
  const maxChars = maxTokens * 4;
  
  // Prioritize by type and importance
  const sorted = [...memories].sort((a, b) => {
    // Reflections first, then by importance
    if (a.type === "reflection" && b.type !== "reflection") return -1;
    if (b.type === "reflection" && a.type !== "reflection") return 1;
    return b.importance - a.importance;
  });

  const summaryParts: string[] = [];
  let currentLength = 0;

  for (const memory of sorted) {
    const line = `[${memory.type}] ${memory.content}`;
    if (currentLength + line.length > maxChars) break;
    summaryParts.push(line);
    currentLength += line.length;
  }

  return summaryParts.join("\n");
}
