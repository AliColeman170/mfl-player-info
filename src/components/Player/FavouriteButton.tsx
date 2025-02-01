import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { Player } from '@/types/global.types';
import { getFavouriteByPlayer } from '@/data/favourites';
import { createClient } from '@/utils/supabase/server';

export async function FavouriteButton({ player }: { player: Player }) {
  const supabase = await createClient();
  const favouriteData = await getFavouriteByPlayer(supabase, player);

  return (
    <ToggleFavouriteButton
      player={player}
      isFavourite={favouriteData?.is_favourite || false}
      className='flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-50 sm:px-3 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'
    />
  );
}
