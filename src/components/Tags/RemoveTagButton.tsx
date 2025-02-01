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
      <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-slate-800'>
        <SpinnerIcon className='h-3 w-3 animate-spin text-white' />
      </div>
    );
  }

  return (
    <button
      onClick={deleteTag}
      className='absolute -right-1 -top-1 hidden rounded-lg bg-indigo-600 p-0.5 text-xs ring-1 ring-slate-950 ring-opacity-5 hover:bg-indigo-600 group-hover:block dark:ring-slate-800'
    >
      <XMarkIcon className='h-3 w-3 text-white' />
    </button>
  );
}
