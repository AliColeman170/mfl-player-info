'use client';

import { SpinnerIcon } from '../SpinnerIcon';
import { use } from 'react';
import { cn } from '@/utils/helpers';
import { Player } from '@/types/global.types';
import { useUser } from '../Wallet/UserProvider';
import { Button } from '../UI/button-alt';
import { HeartIcon } from 'lucide-react';
import { useToggleFavourite } from '@/hooks/useFavouriteMutations';

export function ToggleFavouriteButton({
  player,
  isFavourite,
  className,
  variant = 'ghost',
}: {
  player: Player;
  isFavourite: boolean;
  className?: string;
  variant?:
    | 'ghost'
    | 'link'
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | null;
}) {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const toggleFavouriteMutation = useToggleFavourite();

  console.log({ player });

  async function toggleFavourite() {
    if (!user?.app_metadata.address) return;

    console.log({
      player_id: player.id,
      is_favourite: !isFavourite,
    });

    toggleFavouriteMutation.mutate({
      player_id: player.id,
      is_favourite: !isFavourite,
    });
  }

  return (
    <Button
      disabled={
        !user?.app_metadata.address || toggleFavouriteMutation.isPending
      }
      size='sm'
      className={cn(
        'group flex cursor-pointer items-center justify-center disabled:cursor-not-allowed',
        className
      )}
      onClick={toggleFavourite}
      variant={variant}
    >
      {toggleFavouriteMutation.isPending ? (
        <SpinnerIcon className='animate-spin' />
      ) : isFavourite ? (
        <HeartIcon className='fill-red-500 text-red-500 disabled:text-slate-500' />
      ) : (
        <HeartIcon className='group-hover:text-red-500' />
      )}
    </Button>
  );
}
