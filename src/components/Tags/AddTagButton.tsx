'use client';

import { useState, useTransition } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { updateTags } from '@/actions/favourites';
import { toast } from 'sonner';
import { Button } from '../UI/Button';

export function AddTagButton({
  tags,
  playerId,
}: {
  tags: string[];
  playerId: number;
}) {
  const [newTag, setNewTag] = useState('');
  const [isPending, startTransition] = useTransition();

  async function AddTag(callback: () => void) {
    if (newTag) {
      const currentTags = tags || [];
      const updatedTags = [...currentTags, newTag];
      startTransition(async () => {
        const result = await updateTags(playerId, updatedTags);
        if (!result.success) {
          toast.error(result.message);
        } else {
          setNewTag('');
          callback();
        }
      });
    }
  }

  return (
    <Popover className='relative'>
      <PopoverButton
        as={Button}
        variant='secondary'
        size='icon'
        className={'h-6'}
      >
        <PlusIcon className='size-3' />
      </PopoverButton>

      <PopoverPanel
        anchor={{ to: 'bottom end', gap: 5 }}
        className='bg-popover shadow-foreground/5 ring-ring absolute z-20 w-56 overflow-auto rounded-lg text-sm shadow-2xl ring-1 ring-inset focus:outline-hidden'
      >
        {({ close }) => (
          <div className='p-3'>
            <label className='sr-only'>Tag</label>
            <div className='flex items-center space-x-2'>
              <input
                type='text'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={`Add tag`}
                className='bg-card placeholder:text-muted outline-input focus:outline-primary block h-9 w-full rounded-lg px-3 py-2 text-sm shadow-2xl outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2'
              />
              <Button
                className='text-sm'
                onClick={async () => {
                  await AddTag(close);
                }}
                disabled={!newTag}
              >
                {isPending ? (
                  <SpinnerIcon className='size-5 animate-spin' />
                ) : (
                  'Add'
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
