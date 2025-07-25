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
  resistance: string;
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
  hasPreContract: boolean;
  energy: number;
  offerStatus: number;
  offerMinDivision?: number;
  offerMinRevenueShare?: number;
  offerAutoAccept?: boolean;
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
  resistance: number;
}

export interface OwnedBy {
  walletAddress: string;
  name: string;
  twitter: string;
  lastActive?: number;
}

export interface ActiveContract {
  id: number;
  status: string;
  kind: string;
  revenueShare: number;
  totalRevenueShareLocked: number;
  club: Club;
  startSeason: number;
  nbSeasons: number;
  autoRenewal: boolean;
  createdDateTime: number;
  clauses: string[];
}

export interface Club {
  id: number;
  name: string;
  mainColor: string;
  secondaryColor: string;
  city: string;
  division: number;
  logoVersion: string;
  country: string;
  ownedBy?: OwnedBy;
  squads: any[];
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
  low: number;
  high: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  basedOn: string;
  sampleSize: number;
}

export interface CurrentListing {
  price: number;
}

export type PlayerWithFavouriteData = Player & {
  position_ratings: PositionRating[];
  is_favourite: boolean;
  tags: string[];
  marketValue?: MarketValue;
  currentListing?: CurrentListing;
  club?: Club;
  lastSyncedAt?: string;
  // Computed fields from database
  bestPosition?: string;
  bestOvr?: number;
  ovrDifference?: number;
  priceDifference?: number | null;
};
