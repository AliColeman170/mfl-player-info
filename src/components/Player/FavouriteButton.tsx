import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { Player } from '@/types/global.types';
import { getFavouriteByPlayer } from '@/data/favourites';
import { createClient } from '@/lib/supabase/server';
import { Button } from '../UI/Button';

export async function FavouriteButton({ player }: { player: Player }) {
  const supabase = await createClient();
  const favouriteData = await getFavouriteByPlayer(supabase, player);

  return (
    <Button asChild variant='secondary' size='sm'>
      <ToggleFavouriteButton
        player={player}
        isFavourite={favouriteData?.is_favourite || false}
      />
    </Button>
  );
}
