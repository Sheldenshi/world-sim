/**
 * Game Store - Zustand store that bridges React with the core engine
 *
 * This store maintains backwards compatibility with existing components
 * while using the new modular core engine under the hood.
 */

import { create } from 'zustand';
import type {
  CharacterData,
  GameTime,
  Conversation,
  Direction,
  Position,
  Memory,
  ConversationMessage,
  DailyPlan,
  UserCommand,
} from '@/core/types';

// Re-export types for backwards compatibility
export type { Character } from '@/types';

import { createCharacterSprites } from '@/lib/sprites';
import { createMemory } from '@/core/agents/memory';
import {
  initializeDailyPlan,
  getPlanEmoji,
  getCurrentPlan,
} from '@/lib/planning';

// Use the old Character type for backwards compatibility
import type { Character } from '@/types';

interface GameStore {
  // State
  characters: Character[];
  time: GameTime;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  gridSize: { width: number; height: number };
  tileSize: number;
  simulationLog: string[];

  // Actions
  initializeGame: () => void;
  updateTime: () => void;
  setTimeSpeed: (speed: number) => void;
  togglePause: () => void;
  moveCharacter: (characterId: string, direction: Direction) => void;
  setCharacterPosition: (characterId: string, position: Position) => void;
  addMemory: (characterId: string, memory: Memory) => void;
  addMemories: (characterId: string, memories: Memory[]) => void;
  startConversation: (participantIds: string[], location: Position) => void;
  addConversationMessage: (
    conversationId: string,
    message: Omit<ConversationMessage, 'timestamp'>
  ) => void;
  endConversation: (conversationId: string) => void;
  setCharacterAction: (
    characterId: string,
    action: string,
    emoji?: string
  ) => void;
  updateCharacterPlan: (characterId: string, plan: DailyPlan) => void;
  updateRelationship: (
    characterId: string,
    otherId: string,
    sentiment: number,
    description: string
  ) => void;
  resetImportanceAccumulator: (characterId: string) => void;
  addToLog: (message: string) => void;
  getCharacterById: (id: string) => Character | undefined;
  addUserCommand: (characterId: string, command: string) => void;
  processUserCommand: (characterId: string, commandId: string, result: UserCommand['interpretation']) => void;
}

// Grid configuration
const GRID_WIDTH = 50;
const GRID_HEIGHT = 28;
const TILE_SIZE = 16;

// Create Big Bang Theory characters at end of Season 1
function createInitialCharacters(): Character[] {
  const now = Date.now();

  // Sheldon Cooper - Theoretical Physicist, lives in Apartment 4A
  const sheldon: Character = {
    id: 'sheldon',
    name: 'Sheldon Cooper',
    age: 27,
    position: { x: 4, y: 7 },
    color: '#3B82F6',
    sprite: createCharacterSprites('#3B82F6'),
    direction: 'down',
    isMoving: false,
    personality:
      'Highly intelligent but socially inept. Extremely logical, follows strict routines. Has difficulty understanding sarcasm and social cues. Believes he is intellectually superior to most people.',
    occupation: 'Theoretical Physicist',
    lifestyle:
      'Sheldon follows an extremely rigid schedule. He works at Caltech on string theory research, has specific spots where he sits, specific days for specific activities (like Thai food on Thursdays), and insists on a roommate agreement with Leonard.',
    memoryStream: [
      createMemory('I am Dr. Sheldon Cooper, a theoretical physicist at Caltech with an IQ of 187', 'observation'),
      createMemory('I live in apartment 4A with my roommate Leonard, who is also a physicist', 'observation'),
      createMemory('I have a specific spot on the couch that is mine due to optimal temperature and viewing angle', 'observation'),
      createMemory('Penny is the new neighbor who moved into apartment 4B. She is a waitress and aspiring actress.', 'observation'),
      createMemory('Leonard has developed romantic feelings for Penny, which I find illogical given their intellectual disparity', 'observation'),
      createMemory('Howard Wolowitz is an aerospace engineer who thinks he is charming with women. He is not.', 'observation'),
      createMemory('Raj Koothrappali is an astrophysicist from India who cannot speak to women unless intoxicated', 'observation'),
      createMemory('I am working on a revolutionary theory about the relationship between string theory and M-theory', 'plan'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🧪',
    relationships: {
      leonard: { characterId: 'leonard', description: 'Roommate and colleague, inferior intellect but adequate', lastInteraction: now - 3600000, sentiment: 0.5 },
      penny: { characterId: 'penny', description: "Neighbor from 4B, waitress, Leonard's romantic interest", lastInteraction: now - 86400000, sentiment: 0.2 },
      howard: { characterId: 'howard', description: "Engineer at Caltech, thinks he's charming", lastInteraction: now - 172800000, sentiment: 0.3 },
      raj: { characterId: 'raj', description: 'Astrophysicist, selective mutism around women', lastInteraction: now - 172800000, sentiment: 0.4 },
      stuart: { characterId: 'stuart', description: 'Comic book store owner, sells me my comics', lastInteraction: now - 259200000, sentiment: 0.3 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  // Leonard Hofstadter - Experimental Physicist
  const leonard: Character = {
    id: 'leonard',
    name: 'Leonard Hofstadter',
    age: 27,
    position: { x: 6, y: 7 },
    color: '#22C55E',
    sprite: createCharacterSprites('#22C55E'),
    direction: 'down',
    isMoving: false,
    personality:
      'Intelligent and kind-hearted, but somewhat insecure. More socially aware than his friends. Hopeless romantic who falls in love easily. Often the mediator in the group.',
    occupation: 'Experimental Physicist',
    lifestyle:
      "Leonard works at Caltech on experimental physics research. He tolerates Sheldon's quirks as his roommate, though it's challenging. He's developed strong feelings for Penny and hopes to date her.",
    memoryStream: [
      createMemory('I am Dr. Leonard Hofstadter, an experimental physicist at Caltech', 'observation'),
      createMemory('I share apartment 4A with Sheldon Cooper, who can be... difficult to live with', 'observation'),
      createMemory('Penny moved in across the hall and I am completely smitten with her', 'observation'),
      createMemory('I went on a date with Penny to the opera but things are complicated', 'observation'),
      createMemory('Howard and Raj are my close friends, we do everything together - comics, video games, work', 'observation'),
      createMemory("Sheldon makes me drive him everywhere because he refuses to get a driver's license", 'observation'),
      createMemory("I'm working on an experiment involving laser cooling of atoms", 'plan'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🔬',
    relationships: {
      sheldon: { characterId: 'sheldon', description: 'Genius roommate, exhausting but loyal friend', lastInteraction: now - 3600000, sentiment: 0.5 },
      penny: { characterId: 'penny', description: 'Beautiful neighbor, I have strong feelings for her', lastInteraction: now - 43200000, sentiment: 0.8 },
      howard: { characterId: 'howard', description: 'Good friend, crude but loyal', lastInteraction: now - 86400000, sentiment: 0.6 },
      raj: { characterId: 'raj', description: 'Close friend, selective mutism around women', lastInteraction: now - 86400000, sentiment: 0.6 },
      stuart: { characterId: 'stuart', description: 'Comic store owner, nice guy, seems lonely', lastInteraction: now - 259200000, sentiment: 0.5 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  // Penny - Waitress and aspiring actress
  const penny: Character = {
    id: 'penny',
    name: 'Penny',
    age: 22,
    position: { x: 12, y: 7 },
    color: '#EC4899',
    sprite: createCharacterSprites('#EC4899'),
    direction: 'down',
    isMoving: false,
    personality:
      "Outgoing, friendly, and street-smart. Not academically inclined like her neighbors but has strong social intelligence. Dreams of becoming an actress. Sometimes takes advantage of her neighbors' kindness.",
    occupation: 'Waitress',
    lifestyle:
      'Penny works at The Cheesecake Factory as a waitress while pursuing her acting career. She moved to Pasadena from Nebraska to become an actress. She often hangs out with the guys despite not understanding their geeky interests.',
    memoryStream: [
      createMemory("I'm Penny, I just moved to Pasadena from Nebraska to become an actress", 'observation'),
      createMemory('I work as a waitress at The Cheesecake Factory to pay the bills', 'observation'),
      createMemory('My neighbors are these really smart guys - scientists or something', 'observation'),
      createMemory('Leonard is sweet, he obviously has a crush on me. We went on a date.', 'observation'),
      createMemory('Sheldon is... interesting. Very particular about everything. He has a spot on the couch.', 'observation'),
      createMemory("Howard keeps hitting on me with cheesy pickup lines. It's annoying but harmless.", 'observation'),
      createMemory("Raj can't even talk to me! Apparently he can't talk to any women.", 'observation'),
      createMemory('I have an audition coming up that I need to prepare for', 'plan'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🎭',
    relationships: {
      leonard: { characterId: 'leonard', description: 'Sweet neighbor who has a crush on me', lastInteraction: now - 43200000, sentiment: 0.6 },
      sheldon: { characterId: 'sheldon', description: "Leonard's weird roommate, very particular", lastInteraction: now - 86400000, sentiment: 0.3 },
      howard: { characterId: 'howard', description: 'The creepy one who hits on me constantly', lastInteraction: now - 172800000, sentiment: 0.1 },
      raj: { characterId: 'raj', description: "The quiet one who can't talk to women", lastInteraction: now - 172800000, sentiment: 0.3 },
      stuart: { characterId: 'stuart', description: 'Comic store guy, we went on one date, he was nice but sad', lastInteraction: now - 604800000, sentiment: 0.4 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  // Howard Wolowitz - Aerospace Engineer
  const howard: Character = {
    id: 'howard',
    name: 'Howard Wolowitz',
    age: 27,
    position: { x: 4, y: 22 },
    color: '#F97316',
    sprite: createCharacterSprites('#F97316'),
    direction: 'down',
    isMoving: false,
    personality:
      "Self-proclaimed ladies' man despite living with his mother. Uses cheesy pickup lines. Somewhat insecure about not having a PhD. Skilled engineer who designs equipment for NASA.",
    occupation: 'Aerospace Engineer',
    lifestyle:
      'Howard works at Caltech as an aerospace engineer. He still lives with his mother in her house. He constantly tries to pick up women with elaborate schemes and cheesy lines, with little success.',
    memoryStream: [
      createMemory('I am Howard Wolowitz, aerospace engineer at Caltech. I design equipment for NASA.', 'observation'),
      createMemory('I live with my mother who takes care of me. She makes excellent brisket.', 'observation'),
      createMemory("I don't have a PhD like the others, but I'm still an important part of the team", 'observation'),
      createMemory("Leonard's new neighbor Penny is hot. I've been trying to impress her.", 'observation'),
      createMemory("My pickup lines are legendary, though they don't seem to work on Penny", 'observation'),
      createMemory('I speak six languages including Klingon. Ladies find that impressive.', 'observation'),
      createMemory("I'm working on a design for the Mars Rover waste disposal system", 'plan'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🚀',
    relationships: {
      raj: { characterId: 'raj', description: 'Best friend, we do everything together', lastInteraction: now - 43200000, sentiment: 0.8 },
      leonard: { characterId: 'leonard', description: 'Good friend from Caltech', lastInteraction: now - 86400000, sentiment: 0.6 },
      sheldon: { characterId: 'sheldon', description: "Annoying genius, thinks he's better than everyone", lastInteraction: now - 86400000, sentiment: 0.3 },
      penny: { characterId: 'penny', description: 'Hot neighbor, potential conquest', lastInteraction: now - 172800000, sentiment: 0.5 },
      stuart: { characterId: 'stuart', description: 'Comic store owner, even more pathetic than me', lastInteraction: now - 259200000, sentiment: 0.4 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  // Raj Koothrappali - Astrophysicist
  const raj: Character = {
    id: 'raj',
    name: 'Raj Koothrappali',
    age: 27,
    position: { x: 14, y: 22 },
    color: '#8B5CF6',
    sprite: createCharacterSprites('#8B5CF6'),
    direction: 'down',
    isMoving: false,
    personality:
      'Sweet and romantic at heart but suffers from selective mutism around women. From a wealthy family in India. Sensitive and sometimes overly dramatic. Loves romantic comedies.',
    occupation: 'Astrophysicist',
    lifestyle:
      "Raj works at Caltech studying astrophysics. He comes from a wealthy family in New Delhi. His selective mutism prevents him from talking to women unless he's been drinking alcohol.",
    memoryStream: [
      createMemory('I am Dr. Rajesh Koothrappali, an astrophysicist at Caltech', 'observation'),
      createMemory('I come from a wealthy family in New Delhi, India', 'observation'),
      createMemory("I cannot talk to women unless I have alcohol in my system. It's a medical condition.", 'observation'),
      createMemory('Howard is my best friend. We spend a lot of time together.', 'observation'),
      createMemory("Leonard and Sheldon's neighbor Penny is very attractive. I wish I could talk to her.", 'observation'),
      createMemory("I'm working on research about planetary formation in the Kuiper Belt", 'plan'),
      createMemory('I love romantic comedies and dream of finding true love', 'observation'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '🌟',
    relationships: {
      howard: { characterId: 'howard', description: "Best friend, we're inseparable", lastInteraction: now - 43200000, sentiment: 0.8 },
      leonard: { characterId: 'leonard', description: 'Good friend and colleague', lastInteraction: now - 86400000, sentiment: 0.6 },
      sheldon: { characterId: 'sheldon', description: 'Brilliant but condescending colleague', lastInteraction: now - 86400000, sentiment: 0.4 },
      penny: { characterId: 'penny', description: 'Beautiful neighbor I cannot speak to', lastInteraction: now - 259200000, sentiment: 0.5 },
      stuart: { characterId: 'stuart', description: 'Comic store owner, seems lonely like me sometimes', lastInteraction: now - 259200000, sentiment: 0.5 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  // Stuart Bloom - Comic Book Store Owner
  const stuart: Character = {
    id: 'stuart',
    name: 'Stuart Bloom',
    age: 30,
    position: { x: 43, y: 22 },
    color: '#8B7355',
    sprite: createCharacterSprites('#8B7355'),
    direction: 'down',
    isMoving: false,
    personality:
      'Depressed, self-deprecating, and lonely, but genuinely kind and artistic. Has low self-esteem and often makes sad jokes about his life. Went to art school but ended up running a comic book store.',
    occupation: 'Comic Book Store Owner',
    lifestyle:
      'Stuart owns and operates the Comic Center of Pasadena. The store is not very profitable and he often struggles financially. He spends most of his time alone at the store, hoping for customers.',
    memoryStream: [
      createMemory('I am Stuart Bloom, owner of the Comic Center of Pasadena', 'observation'),
      createMemory('I went to the Rhode Island School of Design, but now I sell comic books', 'observation'),
      createMemory('Business has been slow lately. Most days I just sit here alone.', 'observation'),
      createMemory('Sheldon, Leonard, Howard, and Raj are my best customers. Maybe my only customers.', 'observation'),
      createMemory('I once went on a date with Penny. It was the highlight of my year. She never called back.', 'observation'),
      createMemory("I should probably eat something today. But what's the point?", 'observation'),
      createMemory('New comic book shipment coming in. Maybe someone will actually buy something.', 'plan'),
    ],
    currentPlan: null,
    currentAction: 'Starting the day',
    currentActionEmoji: '📚',
    relationships: {
      sheldon: { characterId: 'sheldon', description: 'Regular customer, very particular about his comics', lastInteraction: now - 172800000, sentiment: 0.4 },
      leonard: { characterId: 'leonard', description: 'Nice customer, sometimes talks to me', lastInteraction: now - 172800000, sentiment: 0.5 },
      howard: { characterId: 'howard', description: 'Regular customer, at least he shows up', lastInteraction: now - 172800000, sentiment: 0.4 },
      raj: { characterId: 'raj', description: 'Regular customer, seems nice', lastInteraction: now - 172800000, sentiment: 0.5 },
      penny: { characterId: 'penny', description: 'We went on one date. She was way out of my league.', lastInteraction: now - 604800000, sentiment: 0.6 },
    },
    lastReflectionTime: now,
    importanceAccumulator: 0,
    pendingCommands: [],
  };

  return [sheldon, leonard, penny, howard, raj, stuart];
}

const initialTime: GameTime = {
  day: 1,
  hour: 8,
  minute: 0,
  speed: 1,
  isPaused: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  characters: createInitialCharacters(),
  time: initialTime,
  conversations: [],
  activeConversation: null,
  gridSize: { width: GRID_WIDTH, height: GRID_HEIGHT },
  tileSize: TILE_SIZE,
  simulationLog: [],

  initializeGame: () => {
    const characters = createInitialCharacters();
    const time = { ...initialTime };

    // Initialize daily plans for each character
    const updatedCharacters = characters.map((c) => ({
      ...c,
      currentPlan: initializeDailyPlan(c, time.day),
    }));

    set({
      characters: updatedCharacters,
      time,
      conversations: [],
      activeConversation: null,
      simulationLog: ['Simulation initialized - Welcome to Pasadena!'],
    });
  },

  updateTime: () => {
    const { time, characters } = get();
    if (time.isPaused) return;

    let { minute, hour, day } = time;
    const prevDay = day;
    minute += 1 * time.speed;

    if (minute >= 60) {
      minute = Math.floor(minute % 60);
      hour += Math.floor(minute / 60) || 1;
    }

    if (hour >= 24) {
      hour = 0;
      day += 1;
    }

    // If day changed, create new plans
    let updatedCharacters = characters;
    if (day !== prevDay) {
      updatedCharacters = characters.map((c) => ({
        ...c,
        currentPlan: initializeDailyPlan(c, day),
      }));
      get().addToLog(`Day ${day} begins`);
    }

    // Update current actions based on plans
    updatedCharacters = updatedCharacters.map((c) => {
      if (c.currentPlan) {
        const currentPlan = getCurrentPlan(c.currentPlan, { ...time, minute, hour, day });
        if (currentPlan) {
          return {
            ...c,
            currentAction: currentPlan.description,
            currentActionEmoji: getPlanEmoji(currentPlan.description),
          };
        }
      }
      return c;
    });

    set({
      time: { ...time, minute, hour, day },
      characters: updatedCharacters,
    });
  },

  setTimeSpeed: (speed: number) => {
    set((state) => ({ time: { ...state.time, speed } }));
  },

  togglePause: () => {
    set((state) => ({
      time: { ...state.time, isPaused: !state.time.isPaused },
    }));
  },

  moveCharacter: (characterId: string, direction: Direction) => {
    const { characters, gridSize } = get();
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    const newPosition = { ...character.position };

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

    const collision = characters.some(
      (c) =>
        c.id !== characterId &&
        c.position.x === newPosition.x &&
        c.position.y === newPosition.y
    );

    if (!collision) {
      set({
        characters: characters.map((c) =>
          c.id === characterId
            ? { ...c, position: newPosition, direction, isMoving: true }
            : c
        ),
      });

      setTimeout(() => {
        set({
          characters: get().characters.map((c) =>
            c.id === characterId ? { ...c, isMoving: false } : c
          ),
        });
      }, 200);
    } else {
      set({
        characters: characters.map((c) =>
          c.id === characterId ? { ...c, direction } : c
        ),
      });
    }
  },

  setCharacterPosition: (characterId: string, position: Position) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId ? { ...c, position } : c
      ),
    });
  },

  addMemory: (characterId: string, memory: Memory) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              memoryStream: [...c.memoryStream, memory],
              importanceAccumulator: c.importanceAccumulator + memory.importance,
            }
          : c
      ),
    });
  },

  addMemories: (characterId: string, memories: Memory[]) => {
    const totalImportance = memories.reduce((sum, m) => sum + m.importance, 0);
    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              memoryStream: [...c.memoryStream, ...memories],
              importanceAccumulator: c.importanceAccumulator + totalImportance,
            }
          : c
      ),
    });
  },

  startConversation: (participantIds: string[], location: Position) => {
    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: participantIds,
      messages: [],
      startTime: Date.now(),
      location,
    };

    set({
      conversations: [...get().conversations, conversation],
      activeConversation: conversation,
    });

    get().addToLog(
      `Conversation started between ${participantIds.join(' and ')}`
    );
  },

  addConversationMessage: (
    conversationId: string,
    message: Omit<ConversationMessage, 'timestamp'>
  ) => {
    const fullMessage: ConversationMessage = {
      ...message,
      timestamp: Date.now(),
    };

    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, fullMessage] }
          : c
      ),
      activeConversation:
        get().activeConversation?.id === conversationId
          ? {
              ...get().activeConversation!,
              messages: [...get().activeConversation!.messages, fullMessage],
            }
          : get().activeConversation,
    });
  },

  endConversation: (conversationId: string) => {
    const conversation = get().conversations.find((c) => c.id === conversationId);

    if (conversation) {
      const summary = `Had a conversation with ${conversation.participants.length} messages exchanged`;
      conversation.participants.forEach((participantId) => {
        get().addMemory(participantId, createMemory(summary, 'conversation'));
      });

      if (conversation.participants.length === 2) {
        const [id1, id2] = conversation.participants;
        get().updateRelationship(id1, id2, 0.1, 'Recent conversation');
        get().updateRelationship(id2, id1, 0.1, 'Recent conversation');
      }
    }

    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId ? { ...c, endTime: Date.now() } : c
      ),
      activeConversation: null,
    });

    get().addToLog('Conversation ended');
  },

  setCharacterAction: (characterId: string, action: string, emoji?: string) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              currentAction: action,
              currentActionEmoji: emoji || getPlanEmoji(action),
            }
          : c
      ),
    });
  },

  updateCharacterPlan: (characterId: string, plan: DailyPlan) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId ? { ...c, currentPlan: plan } : c
      ),
    });
  },

  updateRelationship: (
    characterId: string,
    otherId: string,
    sentimentDelta: number,
    description: string
  ) => {
    set({
      characters: get().characters.map((c) => {
        if (c.id !== characterId) return c;

        const existing = c.relationships[otherId];
        const newSentiment = Math.max(
          -1,
          Math.min(1, (existing?.sentiment || 0) + sentimentDelta)
        );

        return {
          ...c,
          relationships: {
            ...c.relationships,
            [otherId]: {
              characterId: otherId,
              description: description || existing?.description || 'Acquaintance',
              lastInteraction: Date.now(),
              sentiment: newSentiment,
            },
          },
        };
      }),
    });
  },

  resetImportanceAccumulator: (characterId: string) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? { ...c, importanceAccumulator: 0, lastReflectionTime: Date.now() }
          : c
      ),
    });
  },

  addToLog: (message: string) => {
    const { time } = get();
    const timestamp = `Day ${time.day} ${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    set({
      simulationLog: [
        ...get().simulationLog.slice(-100),
        `[${timestamp}] ${message}`,
      ],
    });
  },

  getCharacterById: (id: string) => {
    return get().characters.find((c) => c.id === id);
  },

  addUserCommand: (characterId: string, command: string) => {
    const newCommand: UserCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command,
      issuedAt: Date.now(),
    };

    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? { ...c, pendingCommands: [...c.pendingCommands, newCommand] }
          : c
      ),
    });

    get().addToLog(`Inner voice sent to ${get().getCharacterById(characterId)?.name}`);
  },

  processUserCommand: (characterId: string, commandId: string, interpretation?: string) => {
    set({
      characters: get().characters.map((c) =>
        c.id === characterId
          ? {
              ...c,
              pendingCommands: c.pendingCommands.map((cmd) =>
                cmd.id === commandId
                  ? { ...cmd, processedAt: Date.now(), interpretation }
                  : cmd
              ),
            }
          : c
      ),
    });
  },
}));
