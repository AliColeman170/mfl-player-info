import { getFavouriteByPlayer } from '@/data/favourites';
import { TagsList } from '../Tags/TagsList';
import { Player } from '@/types/global.types';
import { createClient } from '@/utils/supabase/server';

export async function PlayerTags({ player }: { player: Player }) {
  const supabase = await createClient();
  const favourite = await getFavouriteByPlayer(supabase, player);

  if (!favourite) return null;

  return (
    <div className='grid px-1 py-1.5 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
      <dt className='flex items-center space-x-2 text-xs font-semibold uppercase leading-none text-slate-700 @[16rem]/inner:text-base dark:text-slate-400'>
        <span>Tags</span>
      </dt>
      <dd className='col-span-2 flex items-center text-left text-sm capitalize leading-none text-slate-700 @[10rem]/inner:justify-end @[10rem]/inner:text-right @[16rem]/inner:text-base dark:text-slate-200'>
        <TagsList
          playerId={player.id}
          tags={favourite.tags}
          isFavourite={favourite.is_favourite}
          wrap={true}
        />
      </dd>
    </div>
  );
}
