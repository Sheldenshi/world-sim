/**
 * Big Bang Theory Environment Configuration
 */

import type { EnvironmentNode, LocationBounds } from '@/core/types';

export const pasadenaEnvironment: EnvironmentNode = {
  name: 'Pasadena',
  type: 'world',
  children: [
    // === RESIDENTIAL AREA ===
    {
      name: 'Residential Area',
      type: 'area',
      children: [
        {
          name: '2311 Los Robles',
          type: 'building',
          position: { x: 2, y: 2 },
          children: [
            {
              name: 'Apartment 4A',
              type: 'room',
              position: { x: 2, y: 2 },
              children: [
                {
                  name: 'living room',
                  type: 'room',
                  children: [
                    { name: 'couch', type: 'object', state: "Sheldon's spot is on the left" },
                    { name: 'coffee table', type: 'object', state: 'has science magazines' },
                    { name: 'TV', type: 'object', state: 'off' },
                    { name: 'whiteboard', type: 'object', state: 'has equations written on it' },
                    { name: "Leonard's chair", type: 'object', state: 'empty' },
                  ],
                },
                {
                  name: 'kitchen',
                  type: 'room',
                  children: [
                    { name: 'refrigerator', type: 'object', state: 'stocked with leftovers' },
                    { name: 'stove', type: 'object', state: 'off' },
                    { name: 'counter', type: 'object', state: 'clean' },
                    { name: 'takeout menus', type: 'object', state: 'organized by day of week' },
                  ],
                },
              ],
            },
            {
              name: 'Apartment 4B',
              type: 'room',
              position: { x: 10, y: 2 },
              children: [
                {
                  name: 'living room',
                  type: 'room',
                  children: [
                    { name: 'couch', type: 'object', state: 'comfortable' },
                    { name: 'TV', type: 'object', state: 'off' },
                  ],
                },
                {
                  name: 'bedroom',
                  type: 'room',
                  children: [
                    { name: 'bed', type: 'object', state: 'unmade' },
                    { name: 'mirror', type: 'object', state: 'clean' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'Wolowitz House',
          type: 'building',
          position: { x: 2, y: 18 },
          children: [
            {
              name: 'living room',
              type: 'room',
              children: [
                { name: 'old couch', type: 'object', state: 'worn but comfortable' },
                { name: 'tube TV', type: 'object', state: 'off' },
              ],
            },
            {
              name: "Howard's room",
              type: 'room',
              children: [
                { name: 'bed', type: 'object', state: 'has space-themed sheets' },
                { name: 'computer', type: 'object', state: 'has engineering software' },
                { name: 'rocket models', type: 'object', state: 'displayed on shelf' },
              ],
            },
          ],
        },
        {
          name: "Raj's Apartment",
          type: 'building',
          position: { x: 12, y: 18 },
          children: [
            {
              name: 'living room',
              type: 'room',
              children: [
                { name: 'modern sofa', type: 'object', state: 'pristine' },
                { name: 'telescope', type: 'object', state: 'pointed at window' },
                { name: 'wine rack', type: 'object', state: 'well-stocked' },
              ],
            },
          ],
        },
      ],
    },
    // === CALTECH AREA ===
    {
      name: 'Caltech Campus',
      type: 'area',
      children: [
        {
          name: 'Caltech Physics Building',
          type: 'building',
          position: { x: 26, y: 1 },
          children: [
            {
              name: "Sheldon's Office",
              type: 'room',
              children: [
                { name: 'desk', type: 'object', state: 'organized precisely' },
                { name: 'whiteboards', type: 'object', state: 'covered in string theory equations' },
                { name: 'Flash figurine', type: 'object', state: 'on desk' },
              ],
            },
            {
              name: "Leonard's Lab",
              type: 'room',
              children: [
                { name: 'laser equipment', type: 'object', state: 'calibrated' },
                { name: 'optical table', type: 'object', state: 'in use' },
              ],
            },
            {
              name: 'Cafeteria',
              type: 'room',
              children: [
                { name: 'lunch tables', type: 'object', state: 'some occupied' },
                { name: "the guys' usual table", type: 'object', state: 'available' },
              ],
            },
          ],
        },
      ],
    },
    // === COMMERCIAL AREA ===
    {
      name: 'Commercial District',
      type: 'area',
      children: [
        {
          name: 'The Cheesecake Factory',
          type: 'building',
          position: { x: 24, y: 18 },
          children: [
            {
              name: 'dining area',
              type: 'room',
              children: [
                { name: 'booths', type: 'object', state: 'some occupied' },
                { name: 'bar area', type: 'object', state: 'bartender serving drinks' },
              ],
            },
          ],
        },
        {
          name: 'Comic Center of Pasadena',
          type: 'building',
          position: { x: 40, y: 18 },
          children: [
            {
              name: 'main floor',
              type: 'room',
              children: [
                { name: 'comic shelves', type: 'object', state: 'stocked with new releases' },
                { name: 'counter', type: 'object', state: 'Stuart manning register' },
                { name: 'display case', type: 'object', state: 'has collectible figurines' },
              ],
            },
          ],
        },
      ],
    },
    // === PARK ===
    {
      name: 'Park Area',
      type: 'area',
      position: { x: 18, y: 10 },
      children: [
        { name: 'pond', type: 'object', state: 'calm with lily pads' },
        { name: 'trees', type: 'object', state: 'providing shade' },
        { name: 'walking path', type: 'object', state: 'well-maintained' },
      ],
    },
  ],
};

export const pasadenaLocationBounds: Record<string, LocationBounds> = {
  'Apartment 4A': { minX: 2, maxX: 8, minY: 2, maxY: 10 },
  'Apartment 4B': { minX: 10, maxX: 16, minY: 2, maxY: 10 },
  'Caltech': { minX: 26, maxX: 41, minY: 1, maxY: 9 },
  'Wolowitz House': { minX: 2, maxX: 9, minY: 18, maxY: 24 },
  "Raj's Apartment": { minX: 12, maxX: 18, minY: 18, maxY: 24 },
  'Cheesecake Factory': { minX: 24, maxX: 37, minY: 18, maxY: 25 },
  'Comic Store': { minX: 40, maxX: 47, minY: 18, maxY: 23 },
  'Park': { minX: 16, maxX: 22, minY: 9, maxY: 13 },
  'Path': { minX: 0, maxX: 49, minY: 14, maxY: 16 },
};

export const pasadenaLocationPaths: Record<string, string[]> = {
  'Apartment 4A': ['Pasadena', 'Residential Area', '2311 Los Robles', 'Apartment 4A'],
  'Apartment 4B': ['Pasadena', 'Residential Area', '2311 Los Robles', 'Apartment 4B'],
  'Caltech': ['Pasadena', 'Caltech Campus', 'Caltech Physics Building'],
  'Wolowitz House': ['Pasadena', 'Residential Area', 'Wolowitz House'],
  "Raj's Apartment": ['Pasadena', 'Residential Area', "Raj's Apartment"],
  'Cheesecake Factory': ['Pasadena', 'Commercial District', 'The Cheesecake Factory'],
  'Comic Store': ['Pasadena', 'Commercial District', 'Comic Center of Pasadena'],
  'Park': ['Pasadena', 'Park Area'],
  'Path': ['Pasadena', 'Outdoor Path'],
  'Outside': ['Pasadena'],
};
