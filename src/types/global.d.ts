export interface Player {
  id: string;
  metadata: Metadata;
  season: string;
  image: Image;
}

export interface Metadata {
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

export interface Image {
  cid: string;
  path: any;
}

export interface MFLPlayer {
  id: number;
  metadata: Metadata;
  ownedBy: OwnedBy;
  activeContract?: ActiveContract;
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
  name: string;
  twitter: string;
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
