export interface NFTPlayer {
  id: string;
  metadata: NFTMetadata;
  season: string;
  image: NFTImage;
}

export interface NFTMetadata {
  longevity: string;
  height: string;
  positions: string[];
  overall: string;
  nationalities: string[];
  dribbling: string;
  name: string;
  shooting: string;
  physical: string;
  preferredFoot: string;
  pace: string;
  defense: string;
  potential: string;
  goalkeeping: string;
  ageAtMint: string;
  passing: string;
}

export interface NFTImage {
  cid: string;
  path: any;
}

export interface Player {
  id: number;
  metadata: Metadata;
  season?: Season;
  ownedBy?: OwnedBy;
  activeContract?: ActiveContract;
}

export interface Metadata {
  id: number;
  firstName: string;
  lastName: string;
  overall: number;
  nationalities: string[];
  positions: string[];
  preferredFoot: string;
  age: number;
  height: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  goalkeeping: number;
}

export interface OwnedBy {
  walletAddress: string;
  name: string;
}

export interface ActiveContract {
  id: number;
  status: string;
  kind: string;
  revenueShare: number;
  totalRevenueShareLocked: number;
  club: Club;
}

export interface Club {
  id: number;
  name: string;
  division: number;
  ownedBy?: OwnedBy;
  type?: string;
}

export interface Season {
  id: number;
  name: string;
}

export interface Listing {
  listingResourceId: number;
  status: string;
  price: number;
  player?: Player;
  sellerAddress: string;
  sellerName: string;
  buyerAddress?: string;
  buyerName?: string;
  purchaseDateTime?: number;
  createdDateTime: number;
}

export interface Root {
  id: number;
  name: string;
}

export interface Competition {
  id: string;
  status: string;
  type: string;
  name: string;
  code: string;
  prizePool: string;
  hasPassword: boolean;
  featured: boolean;
  subtitle: string;
  primaryColor: string;
  inactiveClubsOnly: boolean;
  areRegistrationsOpen: boolean;
  withAlliances: boolean;
  noFatigue: boolean;
  withXp: boolean;
  maxParticipants: number | null;
  endRegistrationDate: number;
  startingDate: number;
  root: Root;
  season: Season;
  entryFeesAmount: number | null;
}

export interface Stats {
  nbMatches: number;
  time: number;
  goals: number;
  shots: number;
  shotsOnTarget: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  goalsConceded: number;
  wins: number;
  draws: number;
  losses: number;
  v: number;
}

export interface PlayerCompetitionStats {
  competition: Competition;
  club: Club;
  stats: Stats;
}

export interface PlayerStats {
  pace: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defense: number;
  physical: number;
  goalkeeping: number;
}

export type StatKey = keyof PlayerStats;

// Search and API response types
export interface SearchPlayerResult {
  id: number;
  first_name: string | null;
  last_name: string | null;
  overall: number | null;
  primary_position: string | null;
  secondary_positions: string[] | null;
  nationality?: string | null;
  club_id?: number | null;
  club_name?: string | null;
  club_type?: string | null;
  owner_wallet_address?: string | null;
  owner_name?: string | null;
  age?: number | null;
  // Stats (optional for search results)
  pace?: number | null;
  shooting?: number | null;
  passing?: number | null;
  dribbling?: number | null;
  defense?: number | null;
  physical?: number | null;
  goalkeeping?: number | null;
}

export interface BaseAPIResponse {
  success: boolean;
  message: string;
}

export interface PlayerMutationResponse extends BaseAPIResponse {
  player_id: number;
}

export interface MFLUser {
  walletAddress: string;
  name: string;
  description: string;
  country: string;
  city: string;
  color: string;
  twitter: string;
  avatar: string;
  discordUser?: { username: string; discriminator: string };
}

export interface PositionRating {
  positions: string[];
  rating: number;
  difference: number;
}

export interface MarketValue {
  estimate: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
}

export interface CurrentListing {
  price: number;
}

export type PlayerWithFavouriteData = Player & {
  position_ratings: PositionRating[];
  is_favourite: boolean;
  tags: string[];
  marketValue?: MarketValue;
  club?: Club;
  lastSyncedAt?: string;
  // Computed fields from database
  bestPosition?: string;
  bestOvr?: number;
  ovrDifference?: number;
  priceDifference?: number | null;
  // Status fields
  is_retired?: boolean;
  is_burned?: boolean;
};
