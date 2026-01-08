/**
 * Big Bang Theory World Template
 */

import type { WorldTemplate } from '@/core/world';
import { allCharacterTemplates } from './characters';
import { pasadenaEnvironment, pasadenaLocationBounds } from './environment';
import { createCharacterSprites, getColorPalette } from '@/lib/sprites';

export const bigBangTheoryTemplate: WorldTemplate = {
  id: 'big-bang-theory',
  name: 'The Big Bang Theory',
  description: 'Pasadena, 2007 - Season 1. Follow Sheldon, Leonard, Penny, Howard, Raj, and Stuart.',
  gridSize: { width: 50, height: 28 },
  tileSize: 16,
  startTime: {
    day: 1,
    hour: 8,
    minute: 0,
    speed: 1,
    isPaused: false,
  },
  characters: allCharacterTemplates,
  environment: {
    tree: pasadenaEnvironment,
    locationBounds: pasadenaLocationBounds,
  },
  spriteGenerator: createCharacterSprites,
};

// Re-export everything for convenience
export * from './characters';
export * from './environment';
