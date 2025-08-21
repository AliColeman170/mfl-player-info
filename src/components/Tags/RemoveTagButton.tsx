'use client';

import { XMarkIcon } from '@heroicons/react/20/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { useUpdateTags } from '@/hooks/useTagMutations';
import { Badge } from '../UI/badge';

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
      tags: updatedTags,
    });
  }

  if (updateTagsMutation.isPending) {
    return (
      <div className='bg-background absolute inset-0 flex w-full items-center justify-center rounded-md'>
        <SpinnerIcon className='size-3 animate-spin' />
      </div>
    );
  }

  return (
    <button
      onClick={deleteTag}
      className='bg-primary ring-border hover:bg-primary/80 absolute -top-1 -right-1 z-10 hidden rounded-full p-0.5 text-xs ring-1 group-hover:block'
    >
      <XMarkIcon className='size-3 text-white' />
    </button>
  );
}
