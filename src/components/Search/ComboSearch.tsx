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

  function handlePlayerChange(id: number) {
    startTransition(() => {
      router.push(`/player/${id}`);
    });
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
