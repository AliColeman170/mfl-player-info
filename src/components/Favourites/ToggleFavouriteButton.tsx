'use client';

import { HeartIcon as FilledHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { SpinnerIcon } from '../SpinnerIcon';
import { useTransition } from 'react';
import { cn } from '@/utils/helpers';
import { Player } from '@/types/global.types';
import { useUser } from '../Wallet/UserProvider';
import { deleteFavourite, setFavourite } from '@/actions/favourites';
import { toast } from 'sonner';

export function ToggleFavouriteButton({
  player,
  isFavourite,
  className,
}: {
  player: Player;
  isFavourite: boolean;
  className?: string;
}) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  async function toggleFavourite() {
    startTransition(async () => {
      if (!user?.user_metadata.address) return;
      if (isFavourite) {
        const result = await deleteFavourite(player.id);
        if (!result.success) {
          toast.error(result.message);
        }
      } else {
        const result = await setFavourite(player.id, !isFavourite);
        if (!result.success) {
          toast.error(result.message);
        }
      }
    });
  }

  return (
    <button
      disabled={!user?.user_metadata.address}
      className={cn('flex', className)}
      onClick={toggleFavourite}
    >
      {isPending ? (
        <SpinnerIcon className='h-4 w-4 animate-spin text-slate-500' />
      ) : isFavourite ? (
        <FilledHeartIcon className='h-4 w-4 text-red-500 disabled:text-slate-500' />
      ) : (
        <HeartIcon className='h-4 w-4 hover:text-red-500' />
      )}
    </button>
  );
}
