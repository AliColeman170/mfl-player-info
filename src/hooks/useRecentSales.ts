'use client';

import { useQuery } from '@tanstack/react-query';

interface RecentSaleAPIResponse {
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
  purchaseDateTime: number;
  createdDateTime: number;
}

interface RecentSale {
  listingResourceId: number;
  price: number;
  playerId: number;
  playerName: string;
  playerOverall: number;
  playerPositions: string[];
  playerAge: number;
  purchaseDate: Date;
  sellerName: string;
  buyerName: string;
}

async function fetchRecentSales(): Promise<RecentSale[]> {
  const response = await fetch(
    'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=5&status=BOUGHT&type=PLAYER'
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent sales');
  }
  
  const data: RecentSaleAPIResponse[] = await response.json();
  
  return data.map((sale) => ({
    listingResourceId: sale.listingResourceId,
    price: sale.price,
    playerId: sale.player.id,
    playerName: `${sale.player.metadata.firstName} ${sale.player.metadata.lastName}`,
    playerOverall: sale.player.metadata.overall,
    playerPositions: sale.player.metadata.positions,
    playerAge: sale.player.metadata.age,
    purchaseDate: new Date(sale.purchaseDateTime),
    sellerName: sale.sellerName,
    buyerName: sale.player.ownedBy.name,
  }));
}

export function useRecentSales() {
  return useQuery({
    queryKey: ['recent-sales'],
    queryFn: fetchRecentSales,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}