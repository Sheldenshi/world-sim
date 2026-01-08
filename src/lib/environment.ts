/**
 * Environment Tree Structure
 * Based on the paper's hierarchical spatial representation:
 * World → Areas → Buildings → Rooms → Objects
 */

import type { EnvironmentNode, Position } from "@/types";

// The complete environment tree for Pasadena (Big Bang Theory setting)
export const ENVIRONMENT_TREE: EnvironmentNode = {
  name: "Pasadena",
  type: "world",
  children: [
    // === RESIDENTIAL AREA ===
    {
      name: "Residential Area",
      type: "area",
      children: [
        // Apartment Building (2311 North Los Robles Avenue)
        {
          name: "2311 Los Robles",
          type: "building",
          position: { x: 2, y: 2 },
          children: [
            // Apartment 4A - Sheldon and Leonard's
            {
              name: "Apartment 4A",
              type: "room",
              position: { x: 2, y: 2 },
              children: [
                {
                  name: "living room",
                  type: "room",
                  children: [
                    { name: "couch", type: "object", state: "Sheldon's spot is on the left" },
                    { name: "coffee table", type: "object", state: "has science magazines" },
                    { name: "TV", type: "object", state: "off" },
                    { name: "whiteboard", type: "object", state: "has equations written on it" },
                    { name: "Leonard's chair", type: "object", state: "empty" },
                  ],
                },
                {
                  name: "kitchen",
                  type: "room",
                  children: [
                    { name: "refrigerator", type: "object", state: "stocked with leftovers" },
                    { name: "stove", type: "object", state: "off" },
                    { name: "counter", type: "object", state: "clean" },
                    { name: "takeout menus", type: "object", state: "organized by day of week" },
                  ],
                },
                {
                  name: "desk area",
                  type: "room",
                  children: [
                    { name: "computer", type: "object", state: "displaying physics simulations" },
                    { name: "desk", type: "object", state: "covered in papers" },
                  ],
                },
              ],
            },
            // Apartment 4B - Penny's
            {
              name: "Apartment 4B",
              type: "room",
              position: { x: 10, y: 2 },
              children: [
                {
                  name: "living room",
                  type: "room",
                  children: [
                    { name: "couch", type: "object", state: "comfortable" },
                    { name: "coffee table", type: "object", state: "has magazines" },
                    { name: "TV", type: "object", state: "off" },
                  ],
                },
                {
                  name: "bedroom",
                  type: "room",
                  children: [
                    { name: "bed", type: "object", state: "unmade" },
                    { name: "dresser", type: "object", state: "has makeup" },
                    { name: "mirror", type: "object", state: "clean" },
                  ],
                },
                {
                  name: "kitchen",
                  type: "room",
                  children: [
                    { name: "refrigerator", type: "object", state: "mostly empty" },
                    { name: "wine bottles", type: "object", state: "on counter" },
                  ],
                },
              ],
            },
          ],
        },
        // Howard's Mom's House
        {
          name: "Wolowitz House",
          type: "building",
          position: { x: 2, y: 18 },
          children: [
            {
              name: "living room",
              type: "room",
              children: [
                { name: "old couch", type: "object", state: "worn but comfortable" },
                { name: "tube TV", type: "object", state: "off" },
                { name: "coffee table", type: "object", state: "has doilies" },
              ],
            },
            {
              name: "dining room",
              type: "room",
              children: [
                { name: "dining table", type: "object", state: "set for dinner" },
                { name: "china cabinet", type: "object", state: "full of fancy dishes" },
              ],
            },
            {
              name: "kitchen",
              type: "room",
              children: [
                { name: "stove", type: "object", state: "Mrs. Wolowitz is cooking brisket" },
                { name: "refrigerator", type: "object", state: "full of food" },
              ],
            },
            {
              name: "Howard's room",
              type: "room",
              children: [
                { name: "bed", type: "object", state: "has space-themed sheets" },
                { name: "computer", type: "object", state: "has engineering software" },
                { name: "rocket models", type: "object", state: "displayed on shelf" },
              ],
            },
          ],
        },
        // Raj's Apartment
        {
          name: "Raj's Apartment",
          type: "building",
          position: { x: 12, y: 18 },
          children: [
            {
              name: "living room",
              type: "room",
              children: [
                { name: "modern sofa", type: "object", state: "pristine" },
                { name: "large flat-screen TV", type: "object", state: "off" },
                { name: "telescope", type: "object", state: "pointed at window" },
                { name: "wine rack", type: "object", state: "well-stocked" },
              ],
            },
            {
              name: "kitchen",
              type: "room",
              children: [
                { name: "kitchen island", type: "object", state: "clean" },
                { name: "bar stools", type: "object", state: "arranged neatly" },
                { name: "espresso machine", type: "object", state: "ready" },
              ],
            },
            {
              name: "bedroom",
              type: "room",
              children: [
                { name: "fancy bed", type: "object", state: "made with silk sheets" },
                { name: "closet", type: "object", state: "full of designer clothes" },
              ],
            },
          ],
        },
      ],
    },
    // === CALTECH AREA ===
    {
      name: "Caltech Campus",
      type: "area",
      children: [
        {
          name: "Caltech Physics Building",
          type: "building",
          position: { x: 26, y: 1 },
          children: [
            {
              name: "Sheldon's Office",
              type: "room",
              children: [
                { name: "desk", type: "object", state: "organized precisely" },
                { name: "whiteboards", type: "object", state: "covered in string theory equations" },
                { name: "chair", type: "object", state: "at optimal ergonomic height" },
                { name: "Flash figurine", type: "object", state: "on desk" },
              ],
            },
            {
              name: "Leonard's Lab",
              type: "room",
              children: [
                { name: "laser equipment", type: "object", state: "calibrated" },
                { name: "optical table", type: "object", state: "in use" },
                { name: "computer", type: "object", state: "running simulations" },
                { name: "safety goggles", type: "object", state: "on hook" },
              ],
            },
            {
              name: "Cafeteria",
              type: "room",
              children: [
                { name: "lunch tables", type: "object", state: "some occupied" },
                { name: "vending machines", type: "object", state: "operational" },
                { name: "the guys' usual table", type: "object", state: "available" },
              ],
            },
          ],
        },
      ],
    },
    // === COMMERCIAL AREA ===
    {
      name: "Commercial District",
      type: "area",
      children: [
        {
          name: "The Cheesecake Factory",
          type: "building",
          position: { x: 24, y: 18 },
          children: [
            {
              name: "dining area",
              type: "room",
              children: [
                { name: "booths", type: "object", state: "some occupied" },
                { name: "tables", type: "object", state: "set with menus" },
                { name: "bar area", type: "object", state: "bartender serving drinks" },
              ],
            },
            {
              name: "kitchen",
              type: "room",
              children: [
                { name: "grill", type: "object", state: "cooking orders" },
                { name: "prep station", type: "object", state: "busy" },
              ],
            },
          ],
        },
        {
          name: "Comic Center of Pasadena",
          type: "building",
          position: { x: 40, y: 18 },
          children: [
            {
              name: "main floor",
              type: "room",
              children: [
                { name: "comic shelves", type: "object", state: "stocked with new releases" },
                { name: "counter", type: "object", state: "Stuart manning register" },
                { name: "display case", type: "object", state: "has collectible figurines" },
                { name: "new comics rack", type: "object", state: "Wednesday shipment arrived" },
              ],
            },
          ],
        },
      ],
    },
    // === OUTDOOR AREAS ===
    {
      name: "Park Area",
      type: "area",
      position: { x: 18, y: 10 },
      children: [
        {
          name: "pond",
          type: "object",
          state: "calm with lily pads",
        },
        {
          name: "trees",
          type: "object",
          state: "providing shade",
        },
        {
          name: "walking path",
          type: "object",
          state: "well-maintained",
        },
      ],
    },
  ],
};

// Location bounds for each building (for position-based lookups)
export const LOCATION_BOUNDS: Record<
  string,
  { minX: number; maxX: number; minY: number; maxY: number }
> = {
  "Apartment 4A": { minX: 2, maxX: 8, minY: 2, maxY: 10 },
  "Apartment 4B": { minX: 10, maxX: 16, minY: 2, maxY: 10 },
  "Caltech": { minX: 26, maxX: 41, minY: 1, maxY: 9 },
  "Wolowitz House": { minX: 2, maxX: 9, minY: 18, maxY: 24 },
  "Raj's Apartment": { minX: 12, maxX: 18, minY: 18, maxY: 24 },
  "Cheesecake Factory": { minX: 24, maxX: 37, minY: 18, maxY: 25 },
  "Comic Store": { minX: 40, maxX: 47, minY: 18, maxY: 23 },
  "Park": { minX: 16, maxX: 22, minY: 9, maxY: 13 },
  "Path": { minX: 0, maxX: 49, minY: 14, maxY: 16 },
};

/**
 * Get the current location name based on position
 */
export function getLocationFromPosition(position: Position): string {
  for (const [name, bounds] of Object.entries(LOCATION_BOUNDS)) {
    if (
      position.x >= bounds.minX &&
      position.x <= bounds.maxX &&
      position.y >= bounds.minY &&
      position.y <= bounds.maxY
    ) {
      return name;
    }
  }
  return "Outside";
}

/**
 * Get the full location path (e.g., "Pasadena > Residential Area > Apartment 4A > living room")
 */
export function getLocationPath(position: Position): string[] {
  const locationName = getLocationFromPosition(position);
  
  // Build path based on location
  const paths: Record<string, string[]> = {
    "Apartment 4A": ["Pasadena", "Residential Area", "2311 Los Robles", "Apartment 4A"],
    "Apartment 4B": ["Pasadena", "Residential Area", "2311 Los Robles", "Apartment 4B"],
    "Caltech": ["Pasadena", "Caltech Campus", "Caltech Physics Building"],
    "Wolowitz House": ["Pasadena", "Residential Area", "Wolowitz House"],
    "Raj's Apartment": ["Pasadena", "Residential Area", "Raj's Apartment"],
    "Cheesecake Factory": ["Pasadena", "Commercial District", "The Cheesecake Factory"],
    "Comic Store": ["Pasadena", "Commercial District", "Comic Center of Pasadena"],
    "Park": ["Pasadena", "Park Area"],
    "Path": ["Pasadena", "Outdoor Path"],
    "Outside": ["Pasadena"],
  };

  return paths[locationName] || ["Pasadena"];
}

/**
 * Find a node in the environment tree by name
 */
export function findEnvironmentNode(
  name: string,
  node: EnvironmentNode = ENVIRONMENT_TREE
): EnvironmentNode | null {
  if (node.name.toLowerCase().includes(name.toLowerCase())) {
    return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findEnvironmentNode(name, child);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Get all objects in a location
 */
export function getObjectsInLocation(locationName: string): EnvironmentNode[] {
  const node = findEnvironmentNode(locationName);
  if (!node) return [];

  const objects: EnvironmentNode[] = [];

  function collectObjects(n: EnvironmentNode) {
    if (n.type === "object") {
      objects.push(n);
    }
    if (n.children) {
      n.children.forEach(collectObjects);
    }
  }

  collectObjects(node);
  return objects;
}

/**
 * Update an object's state in the environment
 */
export function updateObjectState(
  objectName: string,
  newState: string,
  tree: EnvironmentNode = ENVIRONMENT_TREE
): boolean {
  if (tree.name.toLowerCase() === objectName.toLowerCase() && tree.type === "object") {
    tree.state = newState;
    return true;
  }

  if (tree.children) {
    for (const child of tree.children) {
      if (updateObjectState(objectName, newState, child)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generate a natural language description of the environment at a position
 */
export function describeEnvironment(position: Position): string {
  const location = getLocationFromPosition(position);
  const path = getLocationPath(position);
  const objects = getObjectsInLocation(location);

  let description = `You are in ${path.join(" > ")}. `;

  if (objects.length > 0) {
    const objectDescriptions = objects
      .slice(0, 5) // Limit to 5 objects
      .map((obj) => (obj.state ? `${obj.name} (${obj.state})` : obj.name))
      .join(", ");
    description += `Nearby objects: ${objectDescriptions}.`;
  }

  return description;
}

/**
 * Get nearby locations from a position (for planning/navigation)
 */
export function getNearbyLocations(position: Position, radius: number = 10): string[] {
  const nearby: string[] = [];

  for (const [name, bounds] of Object.entries(LOCATION_BOUNDS)) {
    // Check if any corner of the bounds is within radius
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const distance = Math.sqrt(
      Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
    );

    if (distance <= radius) {
      nearby.push(name);
    }
  }

  return nearby;
}

/**
 * Get the center position of a named location
 */
export function getLocationCenter(locationName: string): Position | null {
  const bounds = LOCATION_BOUNDS[locationName];
  if (!bounds) return null;

  return {
    x: Math.floor((bounds.minX + bounds.maxX) / 2),
    y: Math.floor((bounds.minY + bounds.maxY) / 2),
  };
}
