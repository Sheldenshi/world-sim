import type { Character, GameTime, ConversationMessage, Memory } from "@/types";
import { getTimeContext } from "./time";
import { retrieveMemories, formatMemoriesForContext } from "./memory";

export interface ChatRequest {
  character: Character;
  otherCharacter: Character;
  conversationHistory: ConversationMessage[];
  time: GameTime;
}

export interface ChatResponse {
  message: string;
  shouldEnd?: boolean;
}

// Check if the conversation should naturally end
export async function checkConversationEnding(
  messages: ConversationMessage[],
  characters: Character[]
): Promise<{ shouldEnd: boolean; reason?: string }> {
  if (messages.length < 2) {
    return { shouldEnd: false };
  }

  // Maximum turn limit
  if (messages.length >= 10) {
    return { shouldEnd: true, reason: "Reached maximum exchange limit" };
  }

  // Check for farewell keywords in last message
  const lastMessage = messages[messages.length - 1];
  const farewellKeywords = [
    "goodbye", "bye", "see you", "take care", "gotta go",
    "have to go", "need to go", "later", "farewell", "nice talking",
  ];

  const lowerContent = lastMessage.content.toLowerCase();
  if (farewellKeywords.some((kw) => lowerContent.includes(kw))) {
    return { shouldEnd: true, reason: "Farewell detected" };
  }

  // After 6 exchanges, check with API for natural ending
  if (messages.length >= 6) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationContext: formatConversationForEnding(messages, characters),
          checkEnding: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return { shouldEnd: result.shouldEnd, reason: result.reason };
      }
    } catch (error) {
      console.error("Error checking conversation ending:", error);
    }
  }

  return { shouldEnd: false };
}

function formatConversationForEnding(
  messages: ConversationMessage[],
  characters: Character[]
): string {
  return messages
    .map((m) => {
      const speaker = characters.find((c) => c.id === m.speakerId);
      return `${speaker?.name || "Unknown"}: ${m.content}`;
    })
    .join("\n");
}

export async function generateCharacterResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  const { character, otherCharacter, conversationHistory, time } = request;

  // Retrieve relevant memories for context
  const query = buildMemoryQuery(otherCharacter, conversationHistory);
  const relevantMemories = retrieveMemories(
    character.memoryStream,
    query,
    Date.now(),
    24,
    { recency: 1, importance: 1, relevance: 1.5 },
    5
  );

  const systemPrompt = buildSystemPrompt(character, time, relevantMemories);
  const conversationContext = buildConversationContext(
    character,
    otherCharacter,
    conversationHistory
  );

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemPrompt,
      conversationContext,
      characterName: character.name,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate response");
  }

  const data = await response.json();
  return { message: data.message };
}

function buildMemoryQuery(
  otherCharacter: Character,
  history: ConversationMessage[]
): string {
  let query = otherCharacter.name;
  if (history.length > 0) {
    const lastMessage = history[history.length - 1];
    query += " " + lastMessage.content;
  }
  return query;
}

function buildSystemPrompt(
  character: Character,
  time: GameTime,
  memories: Memory[]
): string {
  const timeContext = getTimeContext(time);
  const memoryContext = formatMemoriesForContext(memories);

  return `You are ${character.name}, a ${character.age}-year-old ${character.occupation}.

PERSONALITY: ${character.personality}

LIFESTYLE: ${character.lifestyle}

CURRENT CONTEXT: ${timeContext}. You are currently: ${character.currentAction}

RELEVANT MEMORIES:
${memoryContext || "No specific memories come to mind."}

INSTRUCTIONS:
- Respond naturally as this character would speak
- Keep responses conversational (1-3 sentences)
- Reference your memories, occupation, or personality when relevant
- Be consistent with your character's traits
- If the conversation feels complete, naturally indicate you need to go
- Don't be overly verbose or formal`;
}

function buildConversationContext(
  character: Character,
  otherCharacter: Character,
  history: ConversationMessage[]
): string {
  let context = `You are talking with ${otherCharacter.name} (${otherCharacter.occupation}).\n\n`;

  // Add relationship context
  const relationship = character.relationships[otherCharacter.id];
  if (relationship) {
    context += `Your relationship: ${relationship.description}\n\n`;
  }

  if (history.length === 0) {
    context += `${otherCharacter.name} is nearby. Start a conversation naturally.`;
  } else {
    context += `Conversation so far:\n`;
    history.forEach((msg) => {
      const speaker = msg.speakerId === character.id ? character.name : otherCharacter.name;
      context += `${speaker}: ${msg.content}\n`;
    });
    context += `\nRespond as ${character.name}:`;
  }

  return context;
}

// Generate a reflection based on memories
export async function generateReflections(
  character: Character
): Promise<string[]> {
  const recentMemories = character.memoryStream.slice(-20);
  const memoryContext = formatMemoriesForContext(recentMemories);

  const characterSummary = `${character.name}, ${character.age}-year-old ${character.occupation}. ${character.personality}`;

  const questions = [
    `What patterns have I noticed in my recent experiences?`,
    `What have I learned about the people around me?`,
    `What are my current priorities and goals?`,
  ];

  try {
    const response = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterSummary,
        memories: memoryContext,
        questions,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.reflections || [];
    }
  } catch (error) {
    console.error("Error generating reflections:", error);
  }

  return [];
}

// Make a decision about what to do next
export async function makeDecision(
  character: Character,
  nearbyCharacters: Character[],
  time: GameTime,
  currentPlan: string
): Promise<{
  shouldMove: boolean;
  direction?: "up" | "down" | "left" | "right";
  shouldInteract: boolean;
  interactWith?: string;
  newAction?: string;
  thought?: string;
}> {
  const recentMemories = character.memoryStream.slice(-5);
  const memoryContext = formatMemoriesForContext(recentMemories);

  const nearbyInfo = nearbyCharacters.map((nc) => ({
    name: nc.name,
    action: nc.currentAction,
    relationship: character.relationships[nc.id]?.description || "Acquaintance",
  }));

  try {
    const response = await fetch("/api/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: {
          name: character.name,
          occupation: character.occupation,
          personality: character.personality,
          currentAction: character.currentAction,
          memoryContext,
        },
        time: {
          hour: time.hour,
          minute: time.minute,
          day: time.day,
        },
        nearbyCharacters: nearbyInfo,
        currentPlan,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Error making decision:", error);
  }

  // Fallback to random behavior
  return {
    shouldMove: Math.random() > 0.5,
    shouldInteract: false,
  };
}
