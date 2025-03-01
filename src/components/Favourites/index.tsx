import { getPlayerPositionRatings } from '@/utils/helpers';
import { getFavourites } from '@/data/favourites';
import { getPlayerById } from '@/data/players';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { TableWrapper } from '../Table/TableWrapper';
import { createClient } from '@/utils/supabase/server';

async function getFavouritesData() {
  const supabase = await createClient();
  const favourites = await getFavourites(supabase);

  if (!favourites) return [];

  const players = await Promise.all(
    favourites.map((fav) => getPlayerById(fav.player_id))
  );

  const playersWithFavData: PlayerWithFavouriteData[] = players.map(
    (player) => {
      const fave = favourites.find((f) => f.player_id == player.id);

      return {
        ...player,
        position_ratings: getPlayerPositionRatings(player, true),
        is_favourite: fave!.is_favourite,
        tags: fave!.tags,
      };
    }
  );

  return playersWithFavData;
}

export async function Favourites() {
  const favourites = await getFavouritesData();

  return <TableWrapper players={favourites} />;
}
