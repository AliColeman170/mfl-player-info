import 'server-only';
import { Listing, Player } from '@/types/global.types';

export const getMarketPriceListingsForPlayer = async (player: Player) => {
  const res = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=3&status=BOUGHT&type=PLAYER&ageMin=${
      player.metadata.age - 1
    }&ageMax=${player.metadata.age + 1}&overallMin=${
      player.metadata.overall - 1
    }&overallMax=${player.metadata.overall + 1}&positions=${player.metadata.positions[0]}&marketplace=all`,
    {
      cache: 'force-cache',
      next: { tags: [`listings/${player.id}`], revalidate: 3600 },
    }
  );
  const listings: Listing[] = await res.json();

  return listings;
};
