'use client';

import { XMarkIcon } from '@heroicons/react/20/solid';
import { useTransition } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { updateTags } from '@/actions/favourites';
import { toast } from 'sonner';

export function RemoveTagButton({
  tags,
  playerId,
  tagIndex,
}: {
  tags: string[];
  playerId: number;
  tagIndex: number;
}) {
  const [isPending, startTransition] = useTransition();

  function deleteTag() {
    const updatedTags = [...tags];
    updatedTags.splice(tagIndex, 1);
    startTransition(async () => {
      const result = await updateTags(playerId, updatedTags);
      if (!result.success) {
        toast.error(result.message);
      }
    });
  }

  if (isPending) {
    return (
      <div className='bg-secondary absolute inset-0 flex items-center justify-center rounded-lg'>
        <SpinnerIcon className='size-3 animate-spin' />
      </div>
    );
  }

  return (
    <button
      onClick={deleteTag}
      className='bg-primary ring-border hover:bg-primary/80 absolute -top-1 -right-1 hidden rounded-lg p-0.5 text-xs ring-1 group-hover:block'
    >
      <XMarkIcon className='size-3 text-white' />
    </button>
  );
}
