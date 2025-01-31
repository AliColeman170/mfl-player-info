'use client';

import { useState, useTransition } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { updateTags } from '@/actions/favourites';

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
      startTransition(() => {
        updateTags(playerId, updatedTags);
        setNewTag('');
        callback();
      });
    }
  }

  return (
    <Popover className='relative'>
      <PopoverButton className='flex cursor-pointer items-center justify-center space-x-2.5 rounded-lg bg-slate-100 px-1.5 py-1.5 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/60'>
        <PlusIcon className='h-3 w-3' />
      </PopoverButton>

      <PopoverPanel
        anchor={{ to: 'bottom end', gap: 5 }}
        className='absolute z-20 w-60 overflow-auto rounded-lg bg-white text-sm shadow-2xl shadow-slate-200 ring-1 ring-slate-950 ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:shadow-slate-900 dark:ring-slate-800'
      >
        {({ close }) => (
          <div className='p-4'>
            <label className='sr-only'>Tag</label>
            <div className='mt-1 flex items-center space-x-2'>
              <input
                type='text'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={`Add tag`}
                className='block w-full rounded-lg border-0 bg-white px-3 py-3 text-base text-slate-900 shadow-2xl shadow-slate-300 ring-1 ring-slate-950 ring-opacity-5 placeholder:text-slate-400 focus:ring-0 dark:bg-slate-900 dark:text-slate-400 dark:shadow-slate-900 dark:ring-slate-800'
              />
              <button
                onClick={async () => {
                  await AddTag(close);
                }}
                disabled={!newTag}
                className='flex w-20 items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              >
                {isPending ? (
                  <SpinnerIcon className='h-5 w-5 animate-spin' />
                ) : (
                  'Add'
                )}
              </button>
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
