export interface Player {
  id: number | string;
  metadata: Metadata;
  ownedBy: OwnedBy;
  activeContract?: ActiveContract;
  energy?: number;
  offerStatus?: number;
  is_favourite?: boolean;
  tags?: string[];
  positionRatings?: PositionRating[];
}

export interface Metadata {
  id: number;
  firstName: string;
  lastName: string;
  name?: string;
  overall: number;
  nationalities: string[];
  positions: string[];
  preferredFoot: string;
  ageAtMint: number;
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
  name?: string;
  lastActive?: number;
}

export interface ActiveContract {
  id: number;
  status: string;
  revenueShare: number;
  club: Club;
  startSeason: number;
  nbSeasons: number;
  autoRenewal: boolean;
  createdDateTime: number;
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
  squads: any[];
}

export interface PositionRating {
  positions: string[];
  rating: number;
  difference: number;
}
