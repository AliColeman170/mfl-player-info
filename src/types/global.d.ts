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
