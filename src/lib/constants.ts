// Position order for sorting and display
export const POSITION_ORDER = [
  'GK',
  'RB',
  'LB',
  'CB',
  'RWB',
  'LWB',
  'CDM',
  'RM',
  'LM',
  'CM',
  'CAM',
  'RW',
  'LW',
  'CF',
  'ST',
] as const;

export type Position = (typeof POSITION_ORDER)[number];

// Create a mapping of position to index for sorting
export const POSITION_INDEX_MAP: Record<string, number> = POSITION_ORDER.reduce(
  (acc, position, index) => ({
    ...acc,
    [position]: index,
  }),
  {}
);

// Function to get position index, returns 999 for unknown positions (sorts to end)
export function getPositionIndex(position: string): number {
  return POSITION_INDEX_MAP[position] ?? 999;
}

// Division configuration
export const DIVISION_CONFIG = {
  1: { name: 'Diamond', color: '#3be9f8' },
  2: { name: 'Platinum', color: '#13d389' },
  3: { name: 'Gold', color: '#ffd23e' },
  4: { name: 'Silver', color: '#f3f3f3' },
  5: { name: 'Bronze', color: '#fd7a00' },
  6: { name: 'Iron', color: '#865e3f' },
  7: { name: 'Stone', color: '#71717a' },
  8: { name: 'Ice', color: '#82a1b7' },
  9: { name: 'Spark', color: '#ffd939' },
  10: { name: 'Flint', color: '#757061' },
} as const;

export type DivisionNumber = keyof typeof DIVISION_CONFIG;

// Helper function to get division info
export function getDivisionInfo(division: number) {
  return DIVISION_CONFIG[division as DivisionNumber] || { name: 'Unknown', color: '#gray' };
}
