'use client';

import { HeartIcon as FilledHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { SpinnerIcon } from '../SpinnerIcon';
import { use, useTransition } from 'react';
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
  const { userPromise } = useUser();
  const user = use(userPromise);
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
      disabled={!user?.user_metadata.address || isPending}
      className={cn('flex cursor-pointer', className)}
      onClick={toggleFavourite}
    >
      {isPending ? (
        <SpinnerIcon className='size-4 animate-spin' />
      ) : isFavourite ? (
        <FilledHeartIcon className='size-4 text-red-500 disabled:text-slate-500' />
      ) : (
        <HeartIcon className='size-4 group-hover:text-red-500' />
      )}
    </button>
  );
}
