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
