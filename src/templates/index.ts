/**
 * World Templates Index
 *
 * Register all available world templates here.
 */

import type { WorldTemplate } from '@/core/world';
import { bigBangTheoryTemplate } from './big-bang-theory';

// All available templates
export const templates: WorldTemplate[] = [
  bigBangTheoryTemplate,
];

// Template lookup by ID
export const templateMap: Record<string, WorldTemplate> = {
  'big-bang-theory': bigBangTheoryTemplate,
};

// Get template by ID
export function getTemplate(id: string): WorldTemplate | undefined {
  return templateMap[id];
}

// Get all templates
export function getAllTemplates(): WorldTemplate[] {
  return templates;
}

// Re-export individual templates
export { bigBangTheoryTemplate } from './big-bang-theory';
