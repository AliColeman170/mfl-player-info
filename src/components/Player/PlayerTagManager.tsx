import { TagManager } from './TagManager';
import { Player } from '@/types/global.types';
import { getFavouriteByPlayer } from '@/data/favourites';
import { createClient } from '@/lib/supabase/server';

interface PlayerTagManagerProps {
  player: Player;
  className?: string;
}

export async function PlayerTagManager({ player, className }: PlayerTagManagerProps) {
  const supabase = await createClient();
  const favouriteData = await getFavouriteByPlayer(supabase, player);

  return (
    <TagManager
      player={player}
      currentTags={favouriteData?.tags || []}
      className={className}
    />
  );
}