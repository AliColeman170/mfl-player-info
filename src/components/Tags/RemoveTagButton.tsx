'use client';

import { XMarkIcon } from '@heroicons/react/20/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { useUpdateTags } from '@/hooks/useTagMutations';

export function RemoveTagButton({
  tags,
  playerId,
  tagIndex,
}: {
  tags: string[];
  playerId: number;
  tagIndex: number;
}) {
  const updateTagsMutation = useUpdateTags();

  function deleteTag() {
    const updatedTags = [...tags];
    updatedTags.splice(tagIndex, 1);
    
    updateTagsMutation.mutate({ 
      player_id: playerId, 
      tags: updatedTags 
    });
  }

  if (updateTagsMutation.isPending) {
    return (
      <div className='bg-secondary absolute inset-0 flex items-center justify-center rounded-lg'>
        <SpinnerIcon className='size-3 animate-spin' />
      </div>
    );
  }

  return (
    <button
      onClick={deleteTag}
      className='bg-primary ring-border hover:bg-primary/80 absolute -top-1 -right-1 hidden rounded-full p-0.5 text-xs ring-1 group-hover:block z-10'
    >
      <XMarkIcon className='size-3 text-white' />
    </button>
  );
}
