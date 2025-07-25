import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { TagManager } from './TagManager';
import { Player } from '@/types/global.types';
import { getFavouriteByPlayer } from '@/data/favourites';
import { createClient } from '@/lib/supabase/server';

interface FavouriteButtonProps {
  player: Player;
  showTags?: boolean;
  className?: string;
}

export async function FavouriteButton({ 
  player, 
  showTags = false,
  className 
}: FavouriteButtonProps) {
  const supabase = await createClient();
  const favouriteData = await getFavouriteByPlayer(supabase, player);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ToggleFavouriteButton
        player={player}
        isFavourite={favouriteData?.is_favourite || false}
      />
      {showTags && (
        <TagManager
          player={player}
          currentTags={favouriteData?.tags || []}
        />
      )}
    </div>
  );
}
