'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/UI/popover';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Loader2Icon, PlusIcon, SaveIcon } from 'lucide-react';
import { useUpdateTags } from '@/hooks/useTagMutations';

export function AddTagButton({
  tags,
  playerId,
}: {
  tags: string[];
  playerId: number;
}) {
  const [newTag, setNewTag] = useState('');
  const [open, setOpen] = useState(false);
  const updateTagsMutation = useUpdateTags();

  async function AddTag() {
    if (newTag.trim()) {
      const currentTags = tags || [];
      const trimmedTag = newTag.trim();

      // Check if tag already exists
      if (currentTags.includes(trimmedTag)) {
        return;
      }

      const updatedTags = [...currentTags, trimmedTag];

      updateTagsMutation.mutate(
        { player_id: playerId, tags: updatedTags },
        {
          onSuccess: () => {
            setNewTag('');
            setOpen(false);
          },
        }
      );
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' className='bg-background size-5 p-0'>
          <PlusIcon className='size-3' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-56 p-3' align='end'>
        <label className='sr-only'>Tag</label>
        <div className='flex items-center gap-x-2'>
          <Input
            type='text'
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder='Add tag'
            className='h-8 text-sm/4'
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                newTag.trim() &&
                !updateTagsMutation.isPending
              ) {
                AddTag();
              }
            }}
            autoFocus
          />
          <Button
            onClick={AddTag}
            disabled={!newTag.trim() || updateTagsMutation.isPending}
            size='sm'
          >
            {updateTagsMutation.isPending ? (
              <Loader2Icon className='animate-spin' />
            ) : (
              <SaveIcon />
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
