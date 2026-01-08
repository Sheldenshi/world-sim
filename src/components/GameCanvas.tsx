"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import Character from "./Character";
import { agentTick, shareInformation } from "@/lib/agent";
import { generateReflections, generateCharacterResponse } from "@/lib/openai";
import { createMemory } from "@/lib/memory";
import { getLocationFromPosition } from "@/lib/environment";

// Color palette (Pokémon-style, muted retro colors)
const COLORS = {
  // Grass & outdoors
  grass: "#7DB870",
  grassDark: "#6BA85E",
  grassLight: "#8DC880",
  path: "#D4B896",
  pathDark: "#C4A886",
  water: "#5B9BD5",
  waterLight: "#7BB5E5",
  
  // Building exteriors
  wallExterior: "#E8D8C8",
  roofRed: "#C75050",
  roofBrown: "#8B6B4B",
  
  // Interior floors
  floorWood: "#D4A574",
  floorWoodDark: "#C49564",
  floorTile: "#E8E0D8",
  floorTileDark: "#D8D0C8",
  floorCarpet: "#B8A090",
  floorCarpetBlue: "#7090B0",
  
  // Furniture
  sofa: "#8B4513",
  sofaCushion: "#CD853F",
  sofaRed: "#B84040",
  sofaGreen: "#408040",
  table: "#8B6B4B",
  tableDark: "#6B4B2B",
  bed: "#DEB887",
  bedSheet: "#F5F5DC",
  bedSheetBlue: "#B0C4DE",
  desk: "#A0522D",
  chair: "#8B4513",
  tv: "#2F2F2F",
  tvScreen: "#404060",
  fridge: "#E8E8E8",
  stove: "#404040",
  counter: "#D4A574",
  bookshelf: "#8B6B4B",
  books: "#8B0000",
  plant: "#228B22",
  plantPot: "#CD853F",
  rug: "#B22222",
  
  // Walls
  wallInterior: "#F5F0E8",
  wallDark: "#D8D0C0",
  door: "#8B5A2B",
  window: "#87CEEB",
  
  // Trees
  treeTrunk: "#6B4423",
  treeLeaves: "#2D5A27",
  treeLeavesLight: "#3D7A37",
};

export default function GameCanvas() {
  const {
    characters,
    time,
    gridSize,
    tileSize,
    updateTime,
    moveCharacter,
    addMemories,
    setCharacterAction,
    addToLog,
    startConversation,
    resetImportanceAccumulator,
    initializeGame,
  } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const aiLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize game on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeGame();
      setIsInitialized(true);
    }
  }, [initializeGame, isInitialized]);

  // Draw the pixel art map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const t = tileSize; // shorthand

    // Clear and draw grass base
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass texture
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const variation = (x * 7 + y * 13) % 12;
        if (variation < 2) {
          ctx.fillStyle = COLORS.grassDark;
          ctx.fillRect(x * t, y * t, t, t);
        } else if (variation === 4) {
          ctx.fillStyle = COLORS.grassLight;
          ctx.fillRect(x * t + t/4, y * t + t/4, t/2, t/2);
        }
      }
    }

    // Draw main paths
    drawPaths(ctx, t, gridSize);

    // Draw buildings with interiors
    // === ROW 1: Apartments ===
    // Apartments 4A and 4B side by side (top left)
    drawApartment4A(ctx, 2, 2, t);
    drawApartment4B(ctx, 10, 2, t);

    // Caltech (top right, large)
    drawCaltech(ctx, 26, 1, t);

    // === ROW 2: More homes ===
    // Howard's Mom's House (middle left)
    drawHowardsMomHouse(ctx, 2, 18, t);

    // Raj's Apartment (middle center)
    drawRajsApartment(ctx, 12, 18, t);

    // Cheesecake Factory (middle right)
    drawCheesecakeFactory(ctx, 24, 18, t);

    // Comic Book Store (next to Cheesecake Factory)
    drawComicStore(ctx, 40, 18, t);

    // Draw trees around the map
    drawTree(ctx, 0, 0, t);
    drawTree(ctx, 19, 0, t);
    drawTree(ctx, 24, 0, t);
    drawTree(ctx, 48, 0, t);
    drawTree(ctx, 0, 14, t);
    drawTree(ctx, 21, 14, t);
    drawTree(ctx, 48, 14, t);
    drawTree(ctx, 0, 26, t);
    drawTree(ctx, 21, 26, t);
    drawTree(ctx, 48, 26, t);

    // Draw pond (between the two rows of buildings)
    drawPond(ctx, 18, 10, t);

  }, [gridSize, tileSize, time.hour]);

  // Get sky overlay based on time
  const getNightOverlay = () => {
    const hour = time.hour;
    if (hour >= 20 || hour < 6) return 0.35;
    if (hour >= 18) return (hour - 18) * 0.175;
    if (hour < 8) return (8 - hour) * 0.175;
    return 0;
  };

  // Game time loop
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      updateTime();
    }, 1000);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [updateTime]);

  // Track last logged action for each character to avoid spam
  const lastLoggedAction = useRef<Map<string, string>>(new Map());
  const lastLoggedLocation = useRef<Map<string, string>>(new Map());

  // Agent behavior loop - use store getters to avoid stale closures
  useEffect(() => {
    const runAgentLoop = async () => {
      // Get fresh state from store to avoid stale closures
      const currentCharacters = useGameStore.getState().characters;
      const currentTime = useGameStore.getState().time;
      const currentGridSize = useGameStore.getState().gridSize;
      
      for (const character of currentCharacters) {
        const result = agentTick(character, currentCharacters, currentTime, currentGridSize);

        // Get store actions fresh
        const store = useGameStore.getState();
        
        if (result.newMemories.length > 0) {
          store.addMemories(character.id, result.newMemories);
        }

        // Log when action changes
        if (result.updatedAction !== character.currentAction) {
          store.setCharacterAction(character.id, result.updatedAction, result.updatedEmoji);
          
          // Log significant action changes (not duplicate logs)
          const lastAction = lastLoggedAction.current.get(character.id);
          if (lastAction !== result.updatedAction) {
            store.addToLog(`${character.name}: ${result.updatedAction}`);
            lastLoggedAction.current.set(character.id, result.updatedAction);
          }
        }

        // Log when character arrives at a new location
        const lastLocation = lastLoggedLocation.current.get(character.id);
        if (result.currentLocation !== lastLocation && result.currentLocation !== "Outside" && result.currentLocation !== "Path") {
          store.addToLog(`${character.name} arrived at ${result.currentLocation}`);
          lastLoggedLocation.current.set(character.id, result.currentLocation);
        }

        // Move character towards their destination
        if (result.movement.shouldMove && result.movement.direction) {
          store.moveCharacter(character.id, result.movement.direction);
          
          // Log when starting to travel to a new destination
          if (result.movement.targetLocation && !result.movement.isAtDestination) {
            const lastTarget = lastLoggedLocation.current.get(character.id + "_target");
            if (lastTarget !== result.movement.targetLocation) {
              store.addToLog(`${character.name} is heading to ${result.movement.targetLocation}`);
              lastLoggedLocation.current.set(character.id + "_target", result.movement.targetLocation);
            }
          }
        }

        if (result.shouldStartConversation) {
          const other = currentCharacters.find((c) => c.id === result.shouldStartConversation);
          if (other) {
            const activeConv = store.activeConversation;
            const isEitherInConversation = activeConv?.participants.includes(character.id) ||
              activeConv?.participants.includes(other.id);

            if (!isEitherInConversation) {
              store.startConversation([character.id, other.id], character.position);
              store.addToLog(`💬 ${character.name} started talking to ${other.name} at ${result.currentLocation}`);

              generateCharacterResponse({
                character,
                otherCharacter: other,
                conversationHistory: [],
                time: currentTime,
              }).then((response) => {
                const currentStore = useGameStore.getState();
                const conv = currentStore.activeConversation;
                if (conv) {
                  currentStore.addConversationMessage(conv.id, {
                    speakerId: character.id,
                    content: response.message,
                  });
                  currentStore.addMemory(
                    character.id,
                    createMemory(
                      `I said to ${other.name}: "${response.message}"`,
                      "conversation"
                    )
                  );
                  // Log the conversation message
                  currentStore.addToLog(`${character.name} says: "${response.message.substring(0, 60)}${response.message.length > 60 ? '...' : ''}"`);
                }
              }).catch(console.error);
            }
          }
        }

        if (result.shouldReflect) {
          store.addToLog(`🧠 ${character.name} is reflecting on recent experiences...`);
          
          try {
            const reflections = await generateReflections(character);
            const reflectionMemories = reflections.map((r) =>
              createMemory(r, "reflection")
            );
            if (reflectionMemories.length > 0) {
              store.addMemories(character.id, reflectionMemories);
              store.addToLog(`💡 ${character.name} gained ${reflectionMemories.length} insights`);
            }
          } catch (error) {
            console.error("Failed to generate reflections:", error);
          }
          
          store.resetImportanceAccumulator(character.id);
        }

        // Handle reactive replanning
        if (result.replanSuggestion) {
          store.addToLog(`❗ ${character.name} notices something and changes plans: ${result.replanSuggestion.activity}`);
          store.setCharacterAction(
            character.id,
            result.replanSuggestion.activity,
            "❗"
          );
        }
      }
    };

    aiLoopRef.current = setInterval(runAgentLoop, 2000); // Runs every 2 seconds

    return () => {
      if (aiLoopRef.current) {
        clearInterval(aiLoopRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - we use useGameStore.getState() to get fresh values

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const selectedCharacter = characters[0];
      if (!selectedCharacter) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
          moveCharacter(selectedCharacter.id, "up");
          break;
        case "ArrowDown":
        case "s":
          moveCharacter(selectedCharacter.id, "down");
          break;
        case "ArrowLeft":
        case "a":
          moveCharacter(selectedCharacter.id, "left");
          break;
        case "ArrowRight":
        case "d":
          moveCharacter(selectedCharacter.id, "right");
          break;
      }
    },
    [characters, moveCharacter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border-4 border-gray-800"
      style={{
        width: gridSize.width * tileSize,
        height: gridSize.height * tileSize,
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Map canvas layer */}
      <canvas
        ref={canvasRef}
        width={gridSize.width * tileSize}
        height={gridSize.height * tileSize}
        className="absolute inset-0 pixelated"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Night overlay */}
      {getNightOverlay() > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `rgba(10, 10, 40, ${getNightOverlay()})`,
          }}
        />
      )}

      {/* Characters */}
      {characters.map((character) => (
        <Character
          key={character.id}
          character={character}
          tileSize={tileSize}
        />
      ))}

      {/* Location labels */}
      <LocationLabel x={2} y={1} tileSize={tileSize} label="Apt 4A" />
      <LocationLabel x={10} y={1} tileSize={tileSize} label="Apt 4B" />
      <LocationLabel x={26} y={0} tileSize={tileSize} label="Caltech" />
      <LocationLabel x={2} y={17} tileSize={tileSize} label="Mrs. Wolowitz" />
      <LocationLabel x={12} y={17} tileSize={tileSize} label="Raj's Apt" />
      <LocationLabel x={24} y={17} tileSize={tileSize} label="Cheesecake Factory" />
      <LocationLabel x={40} y={17} tileSize={tileSize} label="Comic Store" />
    </div>
  );
}

// Location label component
function LocationLabel({ x, y, tileSize, label }: { x: number; y: number; tileSize: number; label: string }) {
  return (
    <div
      className="absolute text-[7px] font-bold text-white px-1 py-0.5 rounded pointer-events-none whitespace-nowrap"
      style={{
        left: x * tileSize,
        top: y * tileSize,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        zIndex: 100,
        fontFamily: "monospace",
      }}
    >
      {label}
    </div>
  );
}

// ============ DRAWING FUNCTIONS ============

function drawPaths(ctx: CanvasRenderingContext2D, t: number, gridSize: { width: number; height: number }) {
  ctx.fillStyle = COLORS.path;
  
  // === HORIZONTAL PATHS ===
  // Main horizontal path (connects all buildings)
  for (let x = 0; x < gridSize.width; x++) {
    ctx.fillRect(x * t, 14 * t, t, t * 2);
  }
  
  // === VERTICAL PATHS ===
  // Left vertical path (connects 4A to horizontal path, then to Howard's mom's house entrance)
  for (let y = 10; y <= 18; y++) {
    ctx.fillRect(6 * t, y * t, t * 2, t);
  }
  
  // Center-left vertical path (connects 4B to Raj's apartment entrance)
  for (let y = 10; y <= 18; y++) {
    ctx.fillRect(14 * t, y * t, t * 2, t);
  }
  
  // Right vertical path (connects Caltech to Cheesecake Factory entrance)
  for (let y = 10; y <= 18; y++) {
    ctx.fillRect(34 * t, y * t, t * 2, t);
  }
  
  // Far right path (to Comic Store entrance)
  for (let y = 14; y <= 18; y++) {
    ctx.fillRect(44 * t, y * t, t * 2, t);
  }

  // Path texture
  ctx.fillStyle = COLORS.pathDark;
  for (let x = 0; x < gridSize.width; x++) {
    if (x % 3 === 0) {
      ctx.fillRect(x * t + t/4, 14 * t + t/4, t/2, t/2);
      ctx.fillRect(x * t + t/4, 15 * t + t/4, t/2, t/2);
    }
  }
}

// Apartment 4A - Sheldon & Leonard's apartment
function drawApartment4A(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 7 * t;
  const h = 8 * t;

  // Floor
  ctx.fillStyle = COLORS.floorWood;
  ctx.fillRect(x, y, w, h);
  
  // Floor pattern
  ctx.fillStyle = COLORS.floorWoodDark;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(x + i * t, y + j * t, t, 2);
      }
    }
  }

  // Walls (top and sides)
  ctx.fillStyle = COLORS.wallInterior;
  ctx.fillRect(x, y, w, t * 0.3); // top wall
  ctx.fillRect(x, y, t * 0.3, h); // left wall
  ctx.fillRect(x + w - t * 0.3, y, t * 0.3, h); // right wall
  
  // Wall outline
  ctx.strokeStyle = COLORS.wallDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === LIVING ROOM (bottom half) ===
  
  // THE COUCH (Sheldon's spot is on the left)
  ctx.fillStyle = COLORS.sofaRed;
  ctx.fillRect(x + t * 1, y + h - t * 2.5, t * 3, t * 1.2);
  // Cushions
  ctx.fillStyle = "#C05050";
  ctx.fillRect(x + t * 1.2, y + h - t * 2.3, t * 0.8, t * 0.8);
  ctx.fillRect(x + t * 2.2, y + h - t * 2.3, t * 0.8, t * 0.8);
  ctx.fillRect(x + t * 3.2, y + h - t * 2.3, t * 0.6, t * 0.8);
  
  // Coffee table
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 1.5, y + h - t * 3.8, t * 2, t * 0.8);
  
  // TV stand and TV
  ctx.fillStyle = COLORS.tableDark;
  ctx.fillRect(x + t * 1, y + h - t * 5.5, t * 3, t * 0.5);
  ctx.fillStyle = COLORS.tv;
  ctx.fillRect(x + t * 1.5, y + h - t * 6.5, t * 2, t * 1);
  ctx.fillStyle = COLORS.tvScreen;
  ctx.fillRect(x + t * 1.6, y + h - t * 6.4, t * 1.8, t * 0.8);

  // Chair (Leonard's spot)
  ctx.fillStyle = COLORS.sofaGreen;
  ctx.fillRect(x + t * 4.5, y + h - t * 3, t * 1.2, t * 1.2);
  
  // === KITCHEN AREA (top right) ===
  
  // Counter
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(x + t * 4.5, y + t * 0.5, t * 2, t * 1);
  
  // Fridge
  ctx.fillStyle = COLORS.fridge;
  ctx.fillRect(x + t * 5.5, y + t * 1.8, t * 1, t * 1.5);
  
  // Stove
  ctx.fillStyle = COLORS.stove;
  ctx.fillRect(x + t * 4.5, y + t * 1.8, t * 0.8, t * 0.8);
  
  // Whiteboards on wall (iconic!)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x + t * 0.5, y + t * 0.5, t * 1.5, t * 1);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + t * 0.5, y + t * 0.5, t * 1.5, t * 1);
  // Equations on whiteboard
  ctx.fillStyle = "#000080";
  ctx.fillRect(x + t * 0.6, y + t * 0.6, t * 0.8, t * 0.1);
  ctx.fillRect(x + t * 0.6, y + t * 0.8, t * 1.2, t * 0.1);
  ctx.fillRect(x + t * 0.6, y + t * 1.0, t * 0.6, t * 0.1);

  // Desk area
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(x + t * 0.5, y + t * 2, t * 2, t * 1);
  
  // Door (bottom)
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 3, y + h - t * 0.4, t * 1.2, t * 0.4);
  
  // "4A" label
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 8px monospace";
  ctx.fillText("4A", x + t * 3.2, y + h - t * 0.1);
}

// Apartment 4B - Penny's apartment
function drawApartment4B(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 7 * t;
  const h = 8 * t;

  // Floor - carpet
  ctx.fillStyle = COLORS.floorCarpet;
  ctx.fillRect(x, y, w, h);

  // Rug
  ctx.fillStyle = COLORS.rug;
  ctx.fillRect(x + t * 2, y + t * 4, t * 3, t * 2);

  // Walls
  ctx.fillStyle = COLORS.wallInterior;
  ctx.fillRect(x, y, w, t * 0.3);
  ctx.fillRect(x, y, t * 0.3, h);
  ctx.fillRect(x + w - t * 0.3, y, t * 0.3, h);
  
  ctx.strokeStyle = COLORS.wallDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === LIVING AREA ===
  
  // Couch
  ctx.fillStyle = "#DDA0DD"; // Pink/purple couch
  ctx.fillRect(x + t * 1, y + h - t * 2.5, t * 2.5, t * 1);
  
  // Coffee table
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 1.2, y + h - t * 3.8, t * 2, t * 0.8);
  
  // TV area
  ctx.fillStyle = COLORS.tableDark;
  ctx.fillRect(x + t * 0.5, y + h - t * 5.5, t * 2.5, t * 0.5);
  ctx.fillStyle = COLORS.tv;
  ctx.fillRect(x + t * 1, y + h - t * 6.3, t * 1.5, t * 0.8);
  ctx.fillStyle = COLORS.tvScreen;
  ctx.fillRect(x + t * 1.1, y + h - t * 6.2, t * 1.3, t * 0.6);

  // === BEDROOM AREA (top) ===
  
  // Bed
  ctx.fillStyle = COLORS.bed;
  ctx.fillRect(x + t * 4, y + t * 0.5, t * 2.5, t * 3);
  ctx.fillStyle = "#FFB6C1"; // Pink sheets
  ctx.fillRect(x + t * 4.2, y + t * 0.7, t * 2.1, t * 2);
  // Pillows
  ctx.fillStyle = "#FFF0F5";
  ctx.fillRect(x + t * 4.3, y + t * 0.8, t * 0.8, t * 0.5);
  ctx.fillRect(x + t * 5.3, y + t * 0.8, t * 0.8, t * 0.5);

  // Dresser
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(x + t * 0.5, y + t * 0.5, t * 1.5, t * 1);
  
  // Mirror above dresser
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(x + t * 0.7, y + t * 1.7, t * 1.1, t * 0.8);
  
  // === KITCHEN AREA ===
  
  // Counter
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(x + t * 4, y + t * 4, t * 2.5, t * 0.8);
  
  // Fridge
  ctx.fillStyle = COLORS.fridge;
  ctx.fillRect(x + t * 5.5, y + t * 5, t * 1, t * 1.5);
  
  // Stove
  ctx.fillStyle = COLORS.stove;
  ctx.fillRect(x + t * 4, y + t * 5, t * 0.8, t * 0.8);

  // Plants (Penny has plants)
  ctx.fillStyle = COLORS.plantPot;
  ctx.fillRect(x + t * 3.8, y + h - t * 2, t * 0.5, t * 0.4);
  ctx.fillStyle = COLORS.plant;
  ctx.beginPath();
  ctx.arc(x + t * 4.05, y + h - t * 2.3, t * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Door
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 3, y + h - t * 0.4, t * 1.2, t * 0.4);
  
  // "4B" label
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 8px monospace";
  ctx.fillText("4B", x + t * 3.2, y + h - t * 0.1);
}

// Caltech - interior with labs, offices, cafeteria
function drawCaltech(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 16 * t;
  const h = 8 * t;

  // Floor - tile pattern
  ctx.fillStyle = COLORS.floorTile;
  ctx.fillRect(x, y, w, h);
  
  // Tile pattern
  ctx.fillStyle = COLORS.floorTileDark;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(x + i * t, y + j * t, t, t);
      }
    }
  }

  // Walls
  ctx.fillStyle = COLORS.wallInterior;
  ctx.fillRect(x, y, w, t * 0.4);
  ctx.fillRect(x, y, t * 0.4, h);
  ctx.fillRect(x + w - t * 0.4, y, t * 0.4, h);
  
  // Internal walls
  ctx.fillRect(x + t * 5, y, t * 0.3, t * 5);
  ctx.fillRect(x + t * 10, y, t * 0.3, t * 5);
  
  ctx.strokeStyle = COLORS.wallDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === SHELDON'S OFFICE (left) ===
  
  // Desk
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(x + t * 1, y + t * 1, t * 2.5, t * 1.2);
  
  // Chair
  ctx.fillStyle = COLORS.chair;
  ctx.fillRect(x + t * 1.8, y + t * 2.5, t * 0.8, t * 0.8);
  
  // Multiple whiteboards (Sheldon's signature)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x + t * 0.5, y + t * 4, t * 2, t * 1.5);
  ctx.fillRect(x + t * 2.8, y + t * 4, t * 1.8, t * 1.5);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + t * 0.5, y + t * 4, t * 2, t * 1.5);
  ctx.strokeRect(x + t * 2.8, y + t * 4, t * 1.8, t * 1.5);
  
  // Equations
  ctx.fillStyle = "#000080";
  ctx.fillRect(x + t * 0.7, y + t * 4.2, t * 1.5, t * 0.1);
  ctx.fillRect(x + t * 0.7, y + t * 4.5, t * 1.2, t * 0.1);
  ctx.fillRect(x + t * 3, y + t * 4.2, t * 1.3, t * 0.1);

  // === LEONARD'S LAB (middle) ===
  
  // Lab bench
  ctx.fillStyle = "#606060";
  ctx.fillRect(x + t * 6, y + t * 1, t * 3.5, t * 1);
  
  // Equipment
  ctx.fillStyle = "#404040";
  ctx.fillRect(x + t * 6.5, y + t * 0.5, t * 0.8, t * 0.5);
  ctx.fillRect(x + t * 8, y + t * 0.5, t * 1, t * 0.5);
  
  // Laser equipment (Leonard's specialty)
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(x + t * 6, y + t * 3, t * 1.5, t * 0.8);
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(x + t * 7.5, y + t * 3.3, t * 2, t * 0.2); // Laser beam!
  
  // Computer
  ctx.fillStyle = COLORS.tv;
  ctx.fillRect(x + t * 6, y + t * 5, t * 1.2, t * 1);
  ctx.fillStyle = "#00FF00";
  ctx.fillRect(x + t * 6.1, y + t * 5.1, t * 1, t * 0.8);

  // === CAFETERIA (right) ===
  
  // Tables
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 11, y + t * 1.5, t * 2, t * 1);
  ctx.fillRect(x + t * 11, y + t * 4, t * 2, t * 1);
  ctx.fillRect(x + t * 13.5, y + t * 2.5, t * 2, t * 1);
  
  // Chairs around tables
  ctx.fillStyle = COLORS.chair;
  const chairPositions = [
    [11.2, 0.8], [12.3, 0.8], [11.2, 2.7], [12.3, 2.7],
    [11.2, 3.3], [12.3, 3.3], [11.2, 5.2], [12.3, 5.2],
    [13.7, 1.8], [14.8, 1.8], [13.7, 3.7], [14.8, 3.7],
  ];
  chairPositions.forEach(([cx, cy]) => {
    ctx.fillRect(x + cx * t, y + cy * t, t * 0.5, t * 0.5);
  });
  
  // Vending machines
  ctx.fillStyle = "#B22222";
  ctx.fillRect(x + t * 14.5, y + t * 5, t * 1, t * 2);
  ctx.fillStyle = "#0000CD";
  ctx.fillRect(x + t * 13.3, y + t * 5, t * 1, t * 2);

  // Main entrance
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 7, y + h - t * 0.4, t * 2, t * 0.4);
  
  // "CALTECH" sign
  ctx.fillStyle = "#FF6600";
  ctx.font = "bold 10px monospace";
  ctx.fillText("CALTECH", x + t * 6, y + h + t * 0.8);
}

// Cheesecake Factory - restaurant interior (entrance faces UP toward path)
function drawCheesecakeFactory(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 14 * t;
  const h = 8 * t;

  // Floor - fancy tile
  ctx.fillStyle = "#DEB887";
  ctx.fillRect(x, y, w, h);
  
  // Tile pattern
  ctx.fillStyle = "#D4A574";
  for (let i = 0; i < 14; i += 2) {
    for (let j = 0; j < 8; j += 2) {
      ctx.fillRect(x + i * t, y + j * t, t * 2, t);
    }
  }

  // Walls (bottom wall instead of top, entrance at top)
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(x, y + h - t * 0.5, w, t * 0.5); // bottom wall
  ctx.fillRect(x, y, t * 0.5, h);
  ctx.fillRect(x + w - t * 0.5, y, t * 0.5, h);
  
  ctx.strokeStyle = "#5D3A1A";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // === KITCHEN (back/bottom) ===
  
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(x + t * 10, y + h - t * 3.5, t * 3.5, t * 3);
  
  // Kitchen equipment
  ctx.fillStyle = COLORS.stove;
  ctx.fillRect(x + t * 10.5, y + h - t * 3, t * 1, t * 1);
  ctx.fillRect(x + t * 12, y + h - t * 3, t * 1, t * 1);
  
  // Fridge
  ctx.fillStyle = COLORS.fridge;
  ctx.fillRect(x + t * 10.5, y + h - t * 1.3, t * 1, t * 0.8);

  // === BAR/COUNTER AREA ===
  
  ctx.fillStyle = "#5D3A1A";
  ctx.fillRect(x + t * 10, y + h - t * 5, t * 3.5, t * 1);
  
  // Bar stools
  ctx.fillStyle = "#8B0000";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + t * (10.5 + i * 0.9), y + h - t * 5.8, t * 0.6, t * 0.6);
  }
  
  // Drinks/glasses on bar
  ctx.fillStyle = "#ADD8E6";
  ctx.fillRect(x + t * 10.5, y + h - t * 4.6, t * 0.3, t * 0.4);
  ctx.fillRect(x + t * 11.5, y + h - t * 4.6, t * 0.3, t * 0.4);
  ctx.fillRect(x + t * 12.5, y + h - t * 4.6, t * 0.3, t * 0.4);

  // === DINING AREA (near entrance at top) ===
  
  // Booths along the walls
  ctx.fillStyle = "#8B0000"; // Dark red booths
  ctx.fillRect(x + t * 0.8, y + t * 1, t * 1.5, t * 2);
  ctx.fillRect(x + t * 0.8, y + t * 4, t * 1.5, t * 2);
  
  // Tables in booths
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 2.5, y + t * 1.5, t * 1.5, t * 1);
  ctx.fillRect(x + t * 2.5, y + t * 4.5, t * 1.5, t * 1);
  
  // Center tables
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 5, y + t * 2, t * 1.5, t * 1);
  ctx.fillRect(x + t * 5, y + t * 5, t * 1.5, t * 1);
  ctx.fillRect(x + t * 7.5, y + t * 2, t * 1.5, t * 1);
  ctx.fillRect(x + t * 7.5, y + t * 5, t * 1.5, t * 1);
  
  // Chairs
  ctx.fillStyle = COLORS.chair;
  const tableChairs = [
    [5.2, 1.3], [6, 1.3], [5.2, 3.2], [6, 3.2],
    [5.2, 4.3], [6, 4.3], [5.2, 6.2], [6, 6.2],
    [7.7, 1.3], [8.5, 1.3], [7.7, 3.2], [8.5, 3.2],
    [7.7, 4.3], [8.5, 4.3], [7.7, 6.2], [8.5, 6.2],
  ];
  tableChairs.forEach(([cx, cy]) => {
    ctx.fillRect(x + cx * t, y + cy * t, t * 0.5, t * 0.5);
  });

  // Plants for decoration (near entrance)
  ctx.fillStyle = COLORS.plantPot;
  ctx.fillRect(x + t * 4.2, y + t * 0.3, t * 0.5, t * 0.4);
  ctx.fillStyle = COLORS.plant;
  ctx.beginPath();
  ctx.arc(x + t * 4.45, y + t * 0.9, t * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Entrance (at TOP, facing up toward the path)
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 1.5, y, t * 2, t * 0.5);
  
  // Sign
  ctx.fillStyle = "#8B0000";
  ctx.font = "bold 8px monospace";
  ctx.fillText("CHEESECAKE", x + t * 0.5, y + h + t * 0.7);
  ctx.fillText("FACTORY", x + t * 1.5, y + h + t * 1.5);
}

// Comic Book Store - interior with shelves (entrance faces UP toward path)
function drawComicStore(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 8 * t;
  const h = 6 * t;

  // Floor
  ctx.fillStyle = COLORS.floorWood;
  ctx.fillRect(x, y, w, h);

  // Walls (bottom wall instead of top, entrance at top)
  ctx.fillStyle = "#4A4A6A";
  ctx.fillRect(x, y + h - t * 0.4, w, t * 0.4); // bottom wall
  ctx.fillRect(x, y, t * 0.4, h);
  ctx.fillRect(x + w - t * 0.4, y, t * 0.4, h);
  
  ctx.strokeStyle = "#2A2A4A";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === COMIC SHELVES (along back/bottom wall) ===
  
  // Shelf units
  ctx.fillStyle = COLORS.bookshelf;
  ctx.fillRect(x + t * 0.5, y + h - t * 4.5, t * 1.5, t * 4);
  ctx.fillRect(x + t * 2.5, y + h - t * 4.5, t * 1.5, t * 4);
  ctx.fillRect(x + t * 6, y + h - t * 4.5, t * 1.5, t * 4);
  
  // Comics on shelves (colorful)
  const comicColors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF00FF", "#00FFFF"];
  for (let shelf = 0; shelf < 3; shelf++) {
    const shelfX = x + t * (0.5 + shelf * 2);
    if (shelf === 2) continue; // Skip middle for center aisle
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = comicColors[(shelf + row + i) % comicColors.length];
        ctx.fillRect(shelfX + t * (0.2 + i * 0.45), y + h - t * (4.3 - row * 1), t * 0.4, t * 0.7);
      }
    }
  }
  
  // Right shelf comics
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = comicColors[(row + i + 3) % comicColors.length];
      ctx.fillRect(x + t * (6.2 + i * 0.45), y + h - t * (4.3 - row * 1), t * 0.4, t * 0.7);
    }
  }

  // === COUNTER (near entrance at top) ===
  
  ctx.fillStyle = COLORS.table;
  ctx.fillRect(x + t * 4.2, y + t * 1, t * 1.5, t * 2);
  
  // Cash register
  ctx.fillStyle = "#404040";
  ctx.fillRect(x + t * 4.5, y + t * 2.2, t * 0.8, t * 0.6);
  
  // === DISPLAY CASE (near entrance) ===
  
  ctx.fillStyle = "#8B6B4B";
  ctx.fillRect(x + t * 4.2, y + t * 3.3, t * 1.5, t * 1.5);
  
  // Action figures in display
  ctx.fillStyle = "#FF0000"; // Superman
  ctx.fillRect(x + t * 4.4, y + t * 3.5, t * 0.3, t * 0.5);
  ctx.fillStyle = "#0000FF"; // Batman
  ctx.fillRect(x + t * 4.9, y + t * 3.5, t * 0.3, t * 0.5);
  ctx.fillStyle = "#00FF00"; // Hulk
  ctx.fillRect(x + t * 5.4, y + t * 3.5, t * 0.3, t * 0.5);

  // NEW! starburst (near entrance)
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath();
  ctx.arc(x + t * 7.3, y + t * 0.7, t * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF0000";
  ctx.font = "bold 5px monospace";
  ctx.fillText("NEW!", x + t * 7, y + t * 0.8);

  // Entrance (at TOP, facing up toward the path)
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 3, y, t * 1.5, t * 0.4);
  
  // Sign
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 8px monospace";
  ctx.fillText("COMICS", x + t * 1, y + h + t * 0.7);
}

// Howard's Mom's House - classic suburban home (entrance faces UP toward path)
function drawHowardsMomHouse(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 8 * t;
  const h = 7 * t;

  // Floor - old carpet
  ctx.fillStyle = "#C4A882";
  ctx.fillRect(x, y, w, h);
  
  // Carpet pattern (old-fashioned floral hint)
  ctx.fillStyle = "#B89872";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i + j) % 3 === 0) {
        ctx.fillRect(x + i * t + t/3, y + j * t + t/3, t/3, t/3);
      }
    }
  }

  // Walls (bottom wall instead of top, entrance at top)
  ctx.fillStyle = "#F5E0D0";
  ctx.fillRect(x, y + h - t * 0.5, w, t * 0.5); // bottom wall
  ctx.fillRect(x, y, t * 0.5, h);
  ctx.fillRect(x + w - t * 0.5, y, t * 0.5, h);
  
  ctx.strokeStyle = "#D4B8A8";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === KITCHEN AREA (back/bottom) ===
  
  // Counter
  ctx.fillStyle = "#D4B896";
  ctx.fillRect(x + t * 4.5, y + h - t * 1.5, t * 3, t * 0.8);
  
  // Stove (where Mrs. Wolowitz cooks)
  ctx.fillStyle = "#E8E8E8";
  ctx.fillRect(x + t * 5.5, y + h - t * 2.7, t * 1.2, t * 1);
  // Burners
  ctx.fillStyle = "#303030";
  ctx.beginPath();
  ctx.arc(x + t * 5.8, y + h - t * 2.4, t * 0.15, 0, Math.PI * 2);
  ctx.arc(x + t * 6.4, y + h - t * 2.4, t * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // Fridge
  ctx.fillStyle = "#E0E0D0";
  ctx.fillRect(x + t * 4.5, y + h - t * 2.7, t * 0.8, t * 1.5);

  // === DINING AREA (right side, middle) ===
  
  // Dining table
  ctx.fillStyle = COLORS.tableDark;
  ctx.fillRect(x + t * 4.5, y + t * 2.5, t * 2.5, t * 1.5);
  
  // Chairs around table
  ctx.fillStyle = "#6B5A4A";
  ctx.fillRect(x + t * 4.7, y + t * 2, t * 0.6, t * 0.4);
  ctx.fillRect(x + t * 6.2, y + t * 2, t * 0.6, t * 0.4);
  ctx.fillRect(x + t * 4.7, y + t * 4.1, t * 0.6, t * 0.4);
  ctx.fillRect(x + t * 6.2, y + t * 4.1, t * 0.6, t * 0.4);

  // === LIVING ROOM (left side) ===
  
  // Old TV (tube TV style) - back/bottom
  ctx.fillStyle = "#4A3A2A";
  ctx.fillRect(x + t * 0.5, y + h - t * 2.5, t * 2, t * 1.5);
  ctx.fillStyle = "#5A6A7A";
  ctx.fillRect(x + t * 0.6, y + h - t * 2.4, t * 1.4, t * 1);
  // Antenna
  ctx.fillStyle = "#404040";
  ctx.fillRect(x + t * 1.2, y + h - t * 2.8, t * 0.1, t * 0.3);
  ctx.fillRect(x + t * 1.6, y + h - t * 2.8, t * 0.1, t * 0.3);
  
  // Big old couch (where Howard often sits) - facing TV
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(x + t * 0.5, y + t * 2.5, t * 2.5, t * 1.2);
  // Cushions
  ctx.fillStyle = "#9B7924";
  ctx.fillRect(x + t * 0.7, y + t * 2.7, t * 0.9, t * 0.8);
  ctx.fillRect(x + t * 1.8, y + t * 2.7, t * 0.9, t * 0.8);
  
  // Coffee table with doilies
  ctx.fillStyle = COLORS.tableDark;
  ctx.fillRect(x + t * 0.8, y + t * 3.9, t * 2, t * 0.8);
  // Doily
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x + t * 1.8, y + t * 4.3, t * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // === HOWARD'S ROOM DOOR (implied, on back wall) ===
  ctx.fillStyle = "#8B5A2B";
  ctx.fillRect(x + t * 3.2, y + h - t * 2.3, t * 1, t * 1.5);
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 5px monospace";
  ctx.fillText("H", x + t * 3.5, y + h - t * 1.4);

  // Decorative elements - family photos on wall
  ctx.fillStyle = "#8B6B4B";
  ctx.fillRect(x + t * 3.5, y + t * 1, t * 0.6, t * 0.8);
  ctx.fillRect(x + t * 3.5, y + t * 2, t * 0.6, t * 0.8);
  
  // Main entrance (at TOP, facing up toward the path)
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 3, y, t * 1.5, t * 0.4);
  
  // Sign
  ctx.fillStyle = "#8B4513";
  ctx.font = "bold 6px monospace";
  ctx.fillText("WOLOWITZ", x + t * 1.5, y + h + t * 0.7);
}

// Raj's Apartment - upscale bachelor pad (entrance faces UP toward path)
function drawRajsApartment(ctx: CanvasRenderingContext2D, startX: number, startY: number, t: number) {
  const x = startX * t;
  const y = startY * t;
  const w = 7 * t;
  const h = 7 * t;

  // Floor - nice hardwood
  ctx.fillStyle = "#C49564";
  ctx.fillRect(x, y, w, h);
  
  // Hardwood pattern
  ctx.fillStyle = "#B48554";
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(x + i * t, y, t, 1);
    ctx.fillRect(x + i * t, y + t * 2, t, 1);
    ctx.fillRect(x + i * t, y + t * 4, t, 1);
    ctx.fillRect(x + i * t, y + t * 6, t, 1);
  }

  // Walls (bottom wall instead of top, entrance at top)
  ctx.fillStyle = "#F0EDE8";
  ctx.fillRect(x, y + h - t * 0.4, w, t * 0.4); // bottom wall
  ctx.fillRect(x, y, t * 0.4, h);
  ctx.fillRect(x + w - t * 0.4, y, t * 0.4, h);
  
  ctx.strokeStyle = "#D0CCC0";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // === BEDROOM AREA (back/bottom) ===
  
  // Nice bed
  ctx.fillStyle = "#DEB887";
  ctx.fillRect(x + t * 4, y + h - t * 2.3, t * 2.5, t * 1.8);
  // Fancy bedding
  ctx.fillStyle = "#4169E1"; // Royal blue
  ctx.fillRect(x + t * 4.2, y + h - t * 2.1, t * 2.1, t * 1);
  // Pillows
  ctx.fillStyle = "#B8860B";
  ctx.fillRect(x + t * 4.3, y + h - t * 2, t * 0.8, t * 0.4);
  ctx.fillRect(x + t * 5.3, y + h - t * 2, t * 0.8, t * 0.4);

  // === KITCHEN (back/bottom left) ===
  
  // Fridge (stainless steel)
  ctx.fillStyle = "#C0C0C0";
  ctx.fillRect(x + t * 0.5, y + h - t * 2, t * 1, t * 1.5);
  
  // Stove
  ctx.fillStyle = "#404040";
  ctx.fillRect(x + t * 1.7, y + h - t * 1.5, t * 1, t * 1);

  // === DINING/KITCHEN (middle) ===
  
  // Kitchen island
  ctx.fillStyle = "#505050";
  ctx.fillRect(x + t * 0.5, y + t * 3.5, t * 2.5, t * 1);
  
  // Bar stools
  ctx.fillStyle = "#606060";
  ctx.fillRect(x + t * 0.8, y + t * 2.8, t * 0.5, t * 0.5);
  ctx.fillRect(x + t * 2.2, y + t * 2.8, t * 0.5, t * 0.5);

  // === LIVING ROOM (near entrance at top) ===
  
  // Big flat screen TV (back wall/bottom area)
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(x + t * 4, y + t * 3.5, t * 2.5, t * 1.2);
  ctx.fillStyle = "#303050";
  ctx.fillRect(x + t * 4.1, y + t * 3.6, t * 2.3, t * 1);
  
  // Entertainment center
  ctx.fillStyle = "#3A3A3A";
  ctx.fillRect(x + t * 4, y + t * 4.8, t * 2.5, t * 0.5);
  
  // Nice modern sofa (Raj has money) - facing TV
  ctx.fillStyle = "#404060";
  ctx.fillRect(x + t * 4, y + t * 1.5, t * 2.5, t * 1);
  // Pillows
  ctx.fillStyle = "#B8860B"; // Gold accent pillows
  ctx.fillRect(x + t * 4.2, y + t * 1.7, t * 0.5, t * 0.6);
  ctx.fillRect(x + t * 5.8, y + t * 1.7, t * 0.5, t * 0.6);
  
  // Coffee table (glass/modern)
  ctx.fillStyle = "#A0A0A0";
  ctx.fillRect(x + t * 4.3, y + t * 2.7, t * 2, t * 0.6);

  // === DECORATIONS ===
  
  // Telescope (Raj is an astrophysicist!) - near entrance
  ctx.fillStyle = "#2F2F2F";
  ctx.fillRect(x + t * 0.5, y + t * 0.8, t * 0.3, t * 1.2);
  ctx.fillStyle = "#404040";
  ctx.fillRect(x + t * 0.3, y + t * 0.6, t * 0.7, t * 0.3);
  
  // Plant (near entrance)
  ctx.fillStyle = COLORS.plantPot;
  ctx.fillRect(x + t * 3.3, y + t * 0.5, t * 0.5, t * 0.4);
  ctx.fillStyle = COLORS.plant;
  ctx.beginPath();
  ctx.arc(x + t * 3.55, y + t * 1, t * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Wine rack (Raj appreciates fine things)
  ctx.fillStyle = "#5A3A2A";
  ctx.fillRect(x + t * 1.5, y + t * 0.8, t * 0.8, t * 1.5);
  // Wine bottles
  ctx.fillStyle = "#8B0000";
  ctx.fillRect(x + t * 1.55, y + t * 0.9, t * 0.2, t * 0.4);
  ctx.fillRect(x + t * 1.55, y + t * 1.4, t * 0.2, t * 0.4);
  ctx.fillRect(x + t * 1.55, y + t * 1.9, t * 0.2, t * 0.4);

  // Main entrance (at TOP, facing up toward the path)
  ctx.fillStyle = COLORS.door;
  ctx.fillRect(x + t * 2.5, y, t * 1.2, t * 0.4);
  
  // Sign
  ctx.fillStyle = "#4169E1";
  ctx.font = "bold 6px monospace";
  ctx.fillText("RAJ'S APT", x + t * 1, y + h + t * 0.7);
}

function drawTree(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, t: number) {
  const x = tileX * t;
  const y = tileY * t;

  // Trunk
  ctx.fillStyle = COLORS.treeTrunk;
  ctx.fillRect(x + t * 0.35, y + t * 1.2, t * 0.3, t * 0.8);

  // Leaves - layered circles
  ctx.fillStyle = COLORS.treeLeaves;
  ctx.beginPath();
  ctx.arc(x + t * 0.5, y + t * 0.8, t * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = COLORS.treeLeavesLight;
  ctx.beginPath();
  ctx.arc(x + t * 0.4, y + t * 0.6, t * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawPond(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, t: number) {
  const x = tileX * t;
  const y = tileY * t;

  // Water
  ctx.fillStyle = COLORS.water;
  ctx.beginPath();
  ctx.ellipse(x + t * 1.5, y + t * 1, t * 2, t * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = COLORS.waterLight;
  ctx.beginPath();
  ctx.ellipse(x + t * 1, y + t * 0.7, t * 0.6, t * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Lily pads
  ctx.fillStyle = "#228B22";
  ctx.beginPath();
  ctx.ellipse(x + t * 2, y + t * 1.2, t * 0.25, t * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + t * 1.3, y + t * 1.3, t * 0.2, t * 0.12, 0.5, 0, Math.PI * 2);
  ctx.fill();
}
