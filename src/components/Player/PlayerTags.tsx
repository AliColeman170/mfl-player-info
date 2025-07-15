import { getFavouriteByPlayer } from '@/data/favourites';
import { TagsList } from '../Tags/TagsList';
import { Player } from '@/types/global.types';
import { createClient } from '@/lib/supabase/server';

export async function PlayerTags({ player }: { player: Player }) {
  const supabase = await createClient();
  const favourite = await getFavouriteByPlayer(supabase, player);

  if (!favourite) return null;

  return (
    <div className='grid px-1 py-1.5 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
      <dt className='text-muted-foreground flex items-center space-x-2 text-xs leading-none font-semibold uppercase @[16rem]/inner:text-base'>
        <span>Tags</span>
      </dt>
      <dd className='col-span-2 flex items-center text-left text-sm leading-none capitalize @[10rem]/inner:justify-end @[10rem]/inner:text-right @[16rem]/inner:text-base'>
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
