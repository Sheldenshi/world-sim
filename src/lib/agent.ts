import type {
  Character,
  GameTime,
  Memory,
  Observation,
  Position,
  Plan,
} from "@/types";
import {
  retrieveMemories,
  createMemory,
  shouldReflect,
  generateReflectionQuestions,
  formatMemoriesForContext,
  createDiffusedMemory,
  recordDiffusion,
  findShareableMemories,
  agentKnowsInformation,
} from "./memory";
import {
  getCurrentPlan,
  initializeDailyPlan,
  decomposePlanToDetailed,
  getPlanEmoji,
  shouldReplan,
} from "./planning";
import {
  getLocationFromPosition,
  describeEnvironment,
  getObjectsInLocation,
  getLocationCenter,
} from "./environment";
import { generateAgentSummary, generateBriefSummary } from "./agentSummary";

// Perception radius (in tiles)
const PERCEPTION_RADIUS = 5;

// Track last observation time to avoid duplicate observations
const lastObservationTime: Map<string, Map<string, number>> = new Map();

// Get nearby characters
export function getNearbyCharacters(
  character: Character,
  allCharacters: Character[],
  radius: number = PERCEPTION_RADIUS
): Character[] {
  return allCharacters.filter((other) => {
    if (other.id === character.id) return false;
    const dx = Math.abs(other.position.x - character.position.x);
    const dy = Math.abs(other.position.y - character.position.y);
    return dx <= radius && dy <= radius;
  });
}

// Generate observation from perceiving another character
export function generateObservation(
  observer: Character,
  observed: Character,
  time: GameTime
): Observation {
  const location = getLocationFromPosition(observed.position);
  return {
    subject: observed.name,
    predicate: "is",
    object: observed.currentAction,
    location: location,
    timestamp: Date.now(),
  };
}

// Perceive environment objects at current location
export function perceiveEnvironment(
  character: Character,
  time: GameTime
): Memory[] {
  const memories: Memory[] = [];
  const location = getLocationFromPosition(character.position);
  const objects = getObjectsInLocation(location);
  
  // Only perceive occasionally to avoid spamming
  if (Math.random() > 0.1) return memories;
  
  // Pick a random object to notice
  if (objects.length > 0) {
    const randomObj = objects[Math.floor(Math.random() * objects.length)];
    if (randomObj.state) {
      const content = `I noticed the ${randomObj.name} in ${location}: ${randomObj.state}`;
      const memory = createMemory(content, "observation");
      memory.importance = 2; // Low importance for routine observations
      memories.push(memory);
    }
  }
  
  return memories;
}

// Convert observation to memory
export function observationToMemory(obs: Observation): Memory {
  const content = `${obs.subject} ${obs.predicate} ${obs.object} at ${obs.location}`;
  return createMemory(content, "observation");
}

// Perceive environment and create observations
export function perceive(
  character: Character,
  allCharacters: Character[],
  time: GameTime
): Memory[] {
  const newMemories: Memory[] = [];
  const nearbyCharacters = getNearbyCharacters(character, allCharacters);
  
  // Get or create observation tracker for this character
  if (!lastObservationTime.has(character.id)) {
    lastObservationTime.set(character.id, new Map());
  }
  const charObservations = lastObservationTime.get(character.id)!;
  const now = Date.now();

  nearbyCharacters.forEach((other) => {
    // Don't observe too frequently (at least 30 seconds between observations of same person)
    const lastObs = charObservations.get(other.id) || 0;
    if (now - lastObs < 30000) return;
    
    const obs = generateObservation(character, other, time);
    const memory = observationToMemory(obs);
    
    // Higher importance if the observed person is doing something interesting
    if (other.currentAction.toLowerCase().includes("talking") ||
        other.currentAction.toLowerCase().includes("party") ||
        other.currentAction.toLowerCase().includes("arguing")) {
      memory.importance = Math.min(10, memory.importance + 3);
    }
    
    newMemories.push(memory);
    charObservations.set(other.id, now);
  });

  // Also perceive environment objects occasionally
  const envMemories = perceiveEnvironment(character, time);
  newMemories.push(...envMemories);

  return newMemories;
}

// Check if an observation should trigger replanning
export async function checkForReactivePlanning(
  character: Character,
  observation: Memory,
  time: GameTime
): Promise<{ shouldReplan: boolean; newActivity?: string; duration?: number }> {
  // Quick heuristic checks before calling API
  const content = observation.content.toLowerCase();
  
  // High-priority triggers (always consider replanning)
  const highPriorityTriggers = [
    "party", "emergency", "fight", "argument", "crying",
    "celebration", "announcement", "important", "urgent"
  ];
  
  // Social triggers (sometimes trigger replanning)
  const socialTriggers = [
    "talking", "conversation", "laughing", "eating", "playing"
  ];
  
  const isHighPriority = highPriorityTriggers.some(t => content.includes(t));
  const isSocial = socialTriggers.some(t => content.includes(t));
  
  if (!isHighPriority && !isSocial) {
    return { shouldReplan: false };
  }
  
  // For high priority, always suggest replanning
  if (isHighPriority) {
    return {
      shouldReplan: true,
      newActivity: `Investigate ${content}`,
      duration: 15
    };
  }
  
  // For social triggers, use personality
  if (isSocial) {
    const isFriendly = character.personality.toLowerCase().includes("friendly") ||
                       character.personality.toLowerCase().includes("social");
    const isLonely = character.personality.toLowerCase().includes("lonely") ||
                     character.memoryStream.some(m => 
                       m.content.toLowerCase().includes("lonely") &&
                       Date.now() - m.createdAt < 3600000
                     );
    
    if (isFriendly || isLonely) {
      if (Math.random() < 0.3) {
        return {
          shouldReplan: true,
          newActivity: "Join the social activity",
          duration: 15
        };
      }
    }
  }
  
  return { shouldReplan: false };
}

// Share information during conversation
export function shareInformation(
  speaker: Character,
  listener: Character
): { sharedMemory: Memory; newMemoryForListener: Memory } | null {
  // Find something worth sharing
  const shareableMemories = findShareableMemories(speaker, listener.id, 1);
  
  if (shareableMemories.length === 0) return null;
  
  const memoryToShare = shareableMemories[0];
  
  // Check if listener already knows this
  if (agentKnowsInformation(listener, memoryToShare.content)) {
    return null;
  }
  
  // Create a new memory for the listener about what they learned
  const learnedContent = `${speaker.name} told me: "${memoryToShare.content}"`;
  const newMemoryForListener = createDiffusedMemory(
    learnedContent,
    "conversation",
    speaker.id,
    memoryToShare.id
  );
  
  // Record the diffusion event
  recordDiffusion(
    memoryToShare,
    speaker.id,
    listener.id,
    "conversation"
  );
  
  // Mark that we've shared this with the listener
  if (!memoryToShare.diffusedTo) {
    memoryToShare.diffusedTo = [];
  }
  memoryToShare.diffusedTo.push(listener.id);
  
  return {
    sharedMemory: memoryToShare,
    newMemoryForListener
  };
}

// Decide whether to interact with nearby character
export function shouldInteract(
  character: Character,
  other: Character,
  time: GameTime
): boolean {
  // Check relationship
  const relationship = character.relationships[other.id];
  
  // Higher chance to interact with people we know
  let interactionChance = 0.1; // Base 10% chance
  
  if (relationship) {
    interactionChance += relationship.sentiment * 0.2; // Up to +20% for positive relationships
    
    // Less likely to interact if we just talked
    const timeSinceLastInteraction = Date.now() - relationship.lastInteraction;
    if (timeSinceLastInteraction < 60000) { // Less than 1 minute
      interactionChance *= 0.1;
    }
  } else {
    // Slightly higher chance to meet new people
    interactionChance = 0.15;
  }
  
  // Personality modifiers
  if (character.personality.toLowerCase().includes("friendly")) {
    interactionChance *= 1.5;
  }
  if (character.personality.toLowerCase().includes("shy")) {
    interactionChance *= 0.5;
  }
  
  return Math.random() < interactionChance;
}

// Get target location from plan description
function getTargetLocationFromPlan(planDescription: string): string | null {
  const lower = planDescription.toLowerCase();
  
  // Map plan descriptions to locations
  // Caltech - work/research location for scientists
  if (lower.includes('caltech') || lower.includes('physics') || lower.includes('research') || 
      lower.includes('string theory') || lower.includes('laser') || lower.includes('experiment') ||
      lower.includes('cafeteria') || lower.includes('office') || lower.includes('lab') ||
      lower.includes('work on') || lower.includes('nasa') || lower.includes('engineering') ||
      lower.includes('astrophysics') || lower.includes('planetary') ||
      (lower.includes('drive') && lower.includes('caltech')) ||
      (lower.includes('lunch') && !lower.includes('home'))) {
    return "Caltech";
  }
  
  // Cheesecake Factory - Penny's workplace
  if (lower.includes('cheesecake') || lower.includes('shift') || 
      (lower.includes('work') && lower.includes('waitress'))) {
    return "Cheesecake Factory";
  }
  
  // Comic Store - Stuart's store, also where characters hang out
  if (lower.includes('comic') || lower.includes('store') || lower.includes('stuart')) {
    return "Comic Store";
  }
  
  // Howard's mom's house
  if (lower.includes("mom") || lower.includes("wolowitz") || lower.includes("brisket") ||
      lower.includes("howard's room") || lower.includes("ma's")) {
    return "Wolowitz House";
  }
  
  // Raj's Apartment
  if (lower.includes("raj's") || lower.includes("raj apartment") || lower.includes("romantic comed")) {
    return "Raj's Apartment";
  }
  
  // Apartment 4A - Sheldon & Leonard's
  if (lower.includes("apartment 4a") || lower.includes("4a") ||
      (lower.includes("guys") && lower.includes("hang")) ||
      lower.includes("halo") || lower.includes("video game") || lower.includes("warcraft") ||
      lower.includes("whiteboard") || lower.includes("roommate agreement")) {
    return "Apartment 4A";
  }
  
  // Apartment 4B - Penny's
  if (lower.includes("apartment 4b") || lower.includes("4b") || lower.includes("penny's")) {
    return "Apartment 4B";
  }
  
  // Home - determine based on character
  if (lower.includes("home") || lower.includes("sleep") || lower.includes("bed") ||
      lower.includes("wake up") || lower.includes("morning routine") || 
      lower.includes("breakfast") || lower.includes("evening") ||
      lower.includes("prepare for bed") || lower.includes("go to sleep")) {
    return "home";
  }
  
  return null;
}

// Get the home location for a character
function getCharacterHome(characterId: string): string {
  const homes: Record<string, string> = {
    'sheldon': 'Apartment 4A',
    'leonard': 'Apartment 4A',
    'penny': 'Apartment 4B',
    'howard': 'Wolowitz House',
    'raj': "Raj's Apartment",
    'stuart': 'Comic Store', // Stuart basically lives at his store
  };
  return homes[characterId] || 'Apartment 4A';
}

// Decide movement direction based on plan and environment
export function decideMovement(
  character: Character,
  allCharacters: Character[],
  time: GameTime,
  gridSize: { width: number; height: number }
): { direction: "up" | "down" | "left" | "right" | null; shouldMove: boolean; targetLocation?: string } {
  // Get current plan
  const currentPlan = character.currentPlan
    ? getCurrentPlan(character.currentPlan, time)
    : null;

  const nearbyCharacters = getNearbyCharacters(character, allCharacters);
  
  // Less likely to move if in conversation (implied by being very close to someone)
  const veryClose = nearbyCharacters.filter(
    (c) =>
      Math.abs(c.position.x - character.position.x) <= 1 &&
      Math.abs(c.position.y - character.position.y) <= 1
  );
  if (veryClose.length > 0) {
    // Stay still if in conversation (unless random chance to leave)
    if (Math.random() > 0.1) {
      return { direction: null, shouldMove: false };
    }
  }
  
  // Determine target location based on current plan
  let targetLocation: string | null = null;
  if (currentPlan) {
    targetLocation = getTargetLocationFromPlan(currentPlan.description);
    if (targetLocation === "home") {
      targetLocation = getCharacterHome(character.id);
    }
  }
  
  // Get target position
  let targetPosition: Position | null = null;
  if (targetLocation) {
    targetPosition = getLocationCenter(targetLocation);
  }
  
  // Check if we're already at the target location
  const currentLocation = getLocationFromPosition(character.position);
  const isAtDestination = targetLocation && currentLocation === targetLocation;
  
  if (isAtDestination) {
    // We're at the destination - stay still mostly
    return { direction: null, shouldMove: false, targetLocation };
  }
  
  // Choose direction
  const directions: ("up" | "down" | "left" | "right")[] = [];
  
  // Add valid directions (not going out of bounds)
  if (character.position.y > 0) directions.push("up");
  if (character.position.y < gridSize.height - 1) directions.push("down");
  if (character.position.x > 0) directions.push("left");
  if (character.position.x < gridSize.width - 1) directions.push("right");
  
  // Filter out directions that would collide with others
  const validDirections = directions.filter((dir) => {
    const newPos = getNewPosition(character.position, dir);
    return !allCharacters.some(
      (c) => c.id !== character.id && c.position.x === newPos.x && c.position.y === newPos.y
    );
  });
  
  if (validDirections.length === 0) {
    return { direction: null, shouldMove: false, targetLocation: targetLocation || undefined };
  }
  
  // ALWAYS move towards target if we have one and we're not there yet
  if (targetPosition) {
    const preferredDir = getDirectionTowards(character.position, targetPosition);
    if (preferredDir && validDirections.includes(preferredDir)) {
      return { direction: preferredDir, shouldMove: true, targetLocation: targetLocation || undefined };
    }
    // If preferred direction blocked, try perpendicular directions
    const perpDirs = getPerpendicularDirections(preferredDir);
    for (const dir of perpDirs) {
      if (dir && validDirections.includes(dir)) {
        return { direction: dir, shouldMove: true, targetLocation: targetLocation || undefined };
      }
    }
    // If all else fails, try any valid direction
    const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
    return { direction, shouldMove: true, targetLocation: targetLocation || undefined };
  }
  
  // If there's someone nearby we want to talk to, move towards them (social behavior)
  if (nearbyCharacters.length > 0 && Math.random() < 0.5) {
    const target = nearbyCharacters[0];
    const preferredDir = getDirectionTowards(character.position, target.position);
    if (preferredDir && validDirections.includes(preferredDir)) {
      return { direction: preferredDir, shouldMove: true };
    }
  }
  
  // No target - small chance to wander
  if (Math.random() < 0.2) {
    const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
    return { direction, shouldMove: true };
  }
  
  return { direction: null, shouldMove: false };
}

// Get perpendicular directions for pathfinding around obstacles
function getPerpendicularDirections(
  dir: "up" | "down" | "left" | "right" | null
): ("up" | "down" | "left" | "right" | null)[] {
  if (dir === "up" || dir === "down") {
    return ["left", "right"];
  }
  if (dir === "left" || dir === "right") {
    return ["up", "down"];
  }
  return [];
}

function getNewPosition(pos: Position, direction: "up" | "down" | "left" | "right"): Position {
  switch (direction) {
    case "up": return { x: pos.x, y: pos.y - 1 };
    case "down": return { x: pos.x, y: pos.y + 1 };
    case "left": return { x: pos.x - 1, y: pos.y };
    case "right": return { x: pos.x + 1, y: pos.y };
  }
}

function getDirectionTowards(from: Position, to: Position): "up" | "down" | "left" | "right" | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else if (dy !== 0) {
    return dy > 0 ? "down" : "up";
  }
  return null;
}

// Update character's current action based on plan
export function updateCurrentAction(character: Character, time: GameTime): string {
  if (!character.currentPlan) {
    return "Standing idle";
  }
  
  const currentPlan = getCurrentPlan(character.currentPlan, time);
  if (!currentPlan) {
    return "Standing idle";
  }
  
  return currentPlan.description;
}

// Main agent tick - called each game tick
export function agentTick(
  character: Character,
  allCharacters: Character[],
  time: GameTime,
  gridSize: { width: number; height: number }
): {
  newMemories: Memory[];
  shouldStartConversation: string | null;
  movement: { direction: "up" | "down" | "left" | "right" | null; shouldMove: boolean; targetLocation?: string };
  updatedAction: string;
  updatedEmoji: string;
  shouldReflect: boolean;
  replanSuggestion?: { activity: string; duration: number };
  currentLocation: string;
  isAtDestination: boolean;
} {
  // 1. Perceive environment
  const newMemories = perceive(character, allCharacters, time);
  
  // 2. Check for reactive replanning based on interesting observations
  let replanSuggestion: { activity: string; duration: number } | undefined;
  
  for (const memory of newMemories) {
    if (memory.importance >= 6) {
      // High importance observation might trigger replan
      const content = memory.content.toLowerCase();
      if (content.includes("party") || content.includes("argument") || 
          content.includes("celebration") || content.includes("emergency")) {
        replanSuggestion = {
          activity: `Investigate: ${memory.content.slice(0, 50)}`,
          duration: 15
        };
        break;
      }
    }
  }
  
  // 3. Check if should interact with anyone
  let shouldStartConversation: string | null = null;
  const nearbyCharacters = getNearbyCharacters(character, allCharacters, 2);
  
  for (const other of nearbyCharacters) {
    if (shouldInteract(character, other, time)) {
      shouldStartConversation = other.id;
      break;
    }
  }
  
  // 4. Process pending user commands (inner voice)
  if (character.pendingCommands && character.pendingCommands.length > 0) {
    const unprocessedCommand = character.pendingCommands.find(c => !c.processedAt);
    if (unprocessedCommand) {
      // Add the command as a memory if not already processed
      const commandMemory = createMemory(
        `I feel drawn to: ${unprocessedCommand.command}`,
        "command"
      );
      commandMemory.importance = 7; // Commands are important
      newMemories.push(commandMemory);
    }
  }
  
  // 5. Decide movement
  const movement = decideMovement(character, allCharacters, time, gridSize);
  
  // 6. Update current action based on plan
  const updatedAction = updateCurrentAction(character, time);
  const updatedEmoji = getPlanEmoji(updatedAction);
  
  // 7. Check if should reflect (paper says threshold of importance accumulation)
  const totalImportance = newMemories.reduce((sum, m) => sum + m.importance, 0);
  const newAccumulator = character.importanceAccumulator + totalImportance;
  const needsReflection = newAccumulator >= 150;
  
  // 8. Get current location info
  const currentLocation = getLocationFromPosition(character.position);
  const isAtDestination = movement.targetLocation 
    ? currentLocation === movement.targetLocation 
    : true;
  
  return {
    newMemories,
    shouldStartConversation,
    movement,
    updatedAction,
    updatedEmoji,
    shouldReflect: needsReflection,
    replanSuggestion,
    currentLocation,
    isAtDestination,
  };
}

// Generate reflection for a character
export async function generateReflection(
  character: Character,
  apiCall: (prompt: string) => Promise<string>
): Promise<Memory[]> {
  const questions = generateReflectionQuestions(character.memoryStream);
  const reflections: Memory[] = [];
  
  for (const question of questions.slice(0, 3)) {
    // Retrieve relevant memories for this question
    const relevantMemories = retrieveMemories(
      character.memoryStream,
      question,
      Date.now(),
      24, // Last 24 game hours
      { recency: 0.5, importance: 1, relevance: 1.5 },
      10
    );
    
    const context = formatMemoriesForContext(relevantMemories);
    const prompt = `Based on these memories about ${character.name}:\n${context}\n\nAnswer: ${question}\n\nProvide a brief insight (1-2 sentences):`;
    
    try {
      const insight = await apiCall(prompt);
      const pointers = relevantMemories.map((m) => m.id);
      reflections.push(createMemory(insight, "reflection", pointers));
    } catch (error) {
      console.error("Failed to generate reflection:", error);
    }
  }
  
  return reflections;
}

// Summarize character for context (uses new agentSummary module)
export function summarizeCharacter(character: Character, time?: GameTime): string {
  if (time) {
    return generateAgentSummary(character, time, true, true);
  }
  
  // Fallback to brief summary
  return generateBriefSummary(character);
}

// Get current location description for an agent
export function getAgentLocationContext(character: Character): string {
  return describeEnvironment(character.position);
}

