import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringEnum,
} from 'nuqs';

// Define position enum based on existing position order
const POSITIONS = [
  'ST',
  'CF',
  'LW',
  'RW',
  'CAM',
  'LM',
  'RM',
  'CM',
  'CDM',
  'LWB',
  'RWB',
  'LB',
  'RB',
  'CB',
  'GK',
] as const;

const PREFERRED_FOOT = ['LEFT', 'RIGHT', 'BOTH'] as const;
const FAVOURITE_FILTER = ['all', 'favourites', 'non-favourites'] as const;
const STATUS_FILTER = ['all', 'available', 'retired', 'burned'] as const;

// Filter parsers for URL state
export const filterParsers = {
  // Global search
  search: parseAsString.withDefault(''),

  // Favourites filter
  favourites: parseAsStringEnum([...FAVOURITE_FILTER]).withDefault('all'),

  // Status filter - now supports multiple selections
  status: parseAsArrayOf(parseAsStringEnum([...STATUS_FILTER])).withDefault([]),

  // Multi-select arrays
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  tagsMatchAll: parseAsBoolean.withDefault(false), // false = match any, true = match all
  nationalities: parseAsArrayOf(parseAsString).withDefault([]),
  primaryPositions: parseAsArrayOf(
    parseAsStringEnum([...POSITIONS])
  ).withDefault([]),
  secondaryPositions: parseAsArrayOf(
    parseAsStringEnum([...POSITIONS])
  ).withDefault([]),
  owners: parseAsArrayOf(parseAsString).withDefault([]),
  clubs: parseAsArrayOf(parseAsString).withDefault([]),
  bestPositions: parseAsArrayOf(parseAsStringEnum([...POSITIONS])).withDefault(
    []
  ),

  // Wallet address filter
  walletAddress: parseAsString.withDefault(''),

  // Single select
  preferredFoot: parseAsStringEnum([...PREFERRED_FOOT]).withOptions({
    clearOnDefault: true,
  }),

  // Number ranges (min/max pairs)
  ageMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  ageMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  heightMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  heightMax: parseAsInteger.withOptions({ clearOnDefault: true }),

  // Rating ranges
  overallMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  overallMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  paceMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  paceMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  shootingMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  shootingMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  passingMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  passingMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  dribblingMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  dribblingMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  defenseMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  defenseMax: parseAsInteger.withOptions({ clearOnDefault: true }),
  physicalMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  physicalMax: parseAsInteger.withOptions({ clearOnDefault: true }),

  // Best overall range
  bestOverallMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  bestOverallMax: parseAsInteger.withOptions({ clearOnDefault: true }),

  // Market value range
  marketValueMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  marketValueMax: parseAsInteger.withOptions({ clearOnDefault: true }),

  // Price difference range
  priceDiffMin: parseAsInteger.withOptions({ clearOnDefault: true }),
  priceDiffMax: parseAsInteger.withOptions({ clearOnDefault: true }),

  // Table settings
  sortBy: parseAsString.withDefault(''),
  sortOrder: parseAsStringEnum(['asc', 'desc'] as const).withOptions({
    clearOnDefault: true,
  }),
};

// Export types
export type FilterState = {
  search: string;
  favourites: FavouriteFilter;
  status: StatusFilter[];
  tags: string[];
  tagsMatchAll: boolean;
  nationalities: string[];
  primaryPositions: Position[];
  secondaryPositions: Position[];
  owners: string[];
  clubs: string[];
  bestPositions: Position[];
  walletAddress: string;
  preferredFoot: PreferredFoot | null;
  ageMin: number | null;
  ageMax: number | null;
  heightMin: number | null;
  heightMax: number | null;
  overallMin: number | null;
  overallMax: number | null;
  paceMin: number | null;
  paceMax: number | null;
  shootingMin: number | null;
  shootingMax: number | null;
  passingMin: number | null;
  passingMax: number | null;
  dribblingMin: number | null;
  dribblingMax: number | null;
  defenseMin: number | null;
  defenseMax: number | null;
  physicalMin: number | null;
  physicalMax: number | null;
  bestOverallMin: number | null;
  bestOverallMax: number | null;
  marketValueMin: number | null;
  marketValueMax: number | null;
  priceDiffMin: number | null;
  priceDiffMax: number | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc' | null;
};
export type Position = (typeof POSITIONS)[number];
export type PreferredFoot = (typeof PREFERRED_FOOT)[number];
export type FavouriteFilter = (typeof FAVOURITE_FILTER)[number];
export type StatusFilter = (typeof STATUS_FILTER)[number];

// Helper type for number ranges
export type NumberRange = {
  min?: number;
  max?: number;
};

// Filter groups for better organization
export const FILTER_GROUPS = {
  SEARCH: ['search', 'favourites', 'status', 'tags', 'walletAddress'],
  DEMOGRAPHICS: [
    'nationalities',
    'ageMin',
    'ageMax',
    'heightMin',
    'heightMax',
    'preferredFoot',
  ],
  POSITIONS: ['primaryPositions', 'secondaryPositions'],
  RATINGS: [
    'overallMin',
    'overallMax',
    'paceMin',
    'paceMax',
    'shootingMin',
    'shootingMax',
    'passingMin',
    'passingMax',
    'dribblingMin',
    'dribblingMax',
    'defenseMin',
    'defenseMax',
    'physicalMin',
    'physicalMax',
  ],
  TABLE: ['sortBy', 'sortOrder'],
} as const;

// Default ranges for sliders
export const DEFAULT_RANGES = {
  age: { min: 16, max: 45 },
  height: { min: 150, max: 210 },
  ratings: { min: 1, max: 99 },
  marketValue: { min: 0, max: 3000 },
  priceDiff: { min: -500, max: 3000 },
} as const;

// Mapping from table column IDs to API sort field names
export const SORT_FIELD_MAPPING = {
  // Basic fields
  id: 'id',
  name: 'metadata.lastName', // Sort by last name for name column
  age: 'metadata.age',
  height: 'metadata.height',
  nationality: 'metadata.nationalities[0]',
  preferredFoot: 'metadata.preferredFoot',
  position: 'metadata.positions[0]',

  // Rating fields
  overall: 'metadata.overall',
  pace: 'metadata.pace',
  shooting: 'metadata.shooting',
  passing: 'metadata.passing',
  dribbling: 'metadata.dribbling',
  defense: 'metadata.defense',
  physical: 'metadata.physical',

  // Computed fields (now working via database)
  bestPosition: 'bestPosition',
  bestRating: 'bestRating',
  difference: 'difference',
  positions: 'metadata.positions[1]', // Secondary positions

  // Market value and listing fields
  marketValue: 'marketValue.estimate',
  priceDifference: 'priceDifference',
  ownerName: 'ownedBy.name',
  club: 'club.name',
} as const;
