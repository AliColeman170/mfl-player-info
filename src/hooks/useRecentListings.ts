'use client';

import { useQuery } from '@tanstack/react-query';

interface RecentListingAPIResponse {
  listingResourceId: number;
  status: string;
  price: number;
  player: {
    id: number;
    metadata: {
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
    };
    ownedBy: {
      walletAddress: string;
      name: string;
    };
  };
  sellerAddress: string;
  sellerName: string;
  createdDateTime: number;
}

interface RecentListing {
  listingResourceId: number;
  price: number;
  playerId: number;
  playerName: string;
  playerOverall: number;
  playerPositions: string[];
  playerAge: number;
  listingDate: Date;
  sellerName: string;
}

async function fetchRecentListings(): Promise<RecentListing[]> {
  const response = await fetch(
    'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=5&status=AVAILABLE&type=PLAYER'
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent listings');
  }
  
  const data: RecentListingAPIResponse[] = await response.json();
  
  return data.map((listing) => ({
    listingResourceId: listing.listingResourceId,
    price: listing.price,
    playerId: listing.player.id,
    playerName: `${listing.player.metadata.firstName} ${listing.player.metadata.lastName}`,
    playerOverall: listing.player.metadata.overall,
    playerPositions: listing.player.metadata.positions,
    playerAge: listing.player.metadata.age,
    listingDate: new Date(listing.createdDateTime),
    sellerName: listing.sellerName,
  }));
}

export function useRecentListings() {
  return useQuery({
    queryKey: ['recent-listings'],
    queryFn: fetchRecentListings,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}