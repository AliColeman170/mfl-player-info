'use client';

import { cn } from '@/utils/helpers';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SearchComboBox } from './SearchComboBox';

export function ComboSearch({
  id,
  className = '',
  autofocus,
}: {
  id?: number;
  className?: string;
  autofocus: boolean;
}) {
  const router = useRouter();

  let [isPending, startTransition] = useTransition();

  function handlePlayerChange(newId: number) {
    // Only navigate if we're going to a different player
    if (newId !== id) {
      startTransition(() => {
        router.push(`/player/${newId}`);
      });
    }
  }

  return (
    <div className={cn('relative mx-auto w-full max-w-xl', className)}>
      <SearchComboBox
        id={id}
        isLoading={isPending}
        autofocus={autofocus}
        handlePlayerChange={handlePlayerChange}
      />
    </div>
  );
}
