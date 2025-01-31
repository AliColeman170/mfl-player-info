import 'server-only';
import { Listing, Player } from '@/types/global.types';

export const getPlayerById = async (id: number) => {
  const res = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${id}`,
    {
      cache: 'force-cache',
      next: { tags: [`players/${id}`], revalidate: 3600 },
    }
  );
  const { player }: { player: Player } = await res.json();
  return player;
};

export const getListingByPlayerId = async (id: number) => {
  const res = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${id}`,
    {
      cache: 'force-cache',
      next: { tags: [`players/${id}`], revalidate: 3600 },
    }
  );
  const { listing }: { listing: Listing } = await res.json();
  return listing;
};

export const getContactDataByPlayer = async (player: Player) => {
  const res = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=400&ageMin=${
      player.metadata.age - 1
    }&ageMax=${player.metadata.age + 1}&overallMin=${
      player.metadata.overall - 1
    }&overallMax=${player.metadata.overall + 1}&positions=${
      player.metadata.positions[0]
    }&excludingMflOwned=true&isFreeAgent=false`,
    {
      cache: 'force-cache',
      next: { tags: [`contract/${player.id}`], revalidate: 3600 },
    }
  );
  const players: Player[] = await res.json();
  return players;
};

export const getCareerStatsByPlayer = async (player: Player) => {
  const res = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${player.id}/competitions`,
    {
      cache: 'force-cache',
      next: { tags: [`stats/${player.id}`], revalidate: 3600 },
    }
  );
  const careerStats = await res.json();
  return careerStats;
};

export const getAllPlayersByOwner = async (address: string) => {
  const LIMIT = 400;
  let page = 0;
  let hasChecked = false;
  let players: Player[] = [];
  let done = false;

  while (!done) {
    const query: string = hasChecked
      ? `&beforePlayerId=${players[players.length - 1].id}`
      : '';

    const res = await fetch(
      `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?ownerWalletAddress=${address}&limit=${LIMIT}${query}`,
      {
        cache: 'force-cache',
        next: { revalidate: 3600 },
      }
    );
    const retrievedPlayers = await res.json();
    players.push(...retrievedPlayers);
    if (retrievedPlayers.length === 0 || players.length < (page + 1) * 400) {
      done = true;
    }
    page++;
    hasChecked = true;
  }

  return players;
};
