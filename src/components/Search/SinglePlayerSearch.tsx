'use client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useTransition } from 'react';
import { SearchInput } from './SearchInput';
import { useDebounceValue } from 'usehooks-ts';

export function SinglePlayerSearch({ id }: { id?: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [debouncedPlayerId, setPlayerId] = useDebounceValue<string>(
    id ? id.toString() : '',
    800
  );

  useEffect(() => {
    function searchPlayer(id: number) {
      if (id) {
        startTransition(() => {
          router.push(`/player/${id}`);
        });
      } else {
        router.push(`/`);
      }
    }
    searchPlayer(+debouncedPlayerId);
  }, [debouncedPlayerId, router]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      setPlayerId(e.target.value);
    } else {
      setPlayerId('');
    }
  }

  return (
    <div className='mx-auto w-full max-w-xl'>
      <SearchInput
        value={id?.toString() ?? ''}
        handleSearch={handleSearchChange}
        isLoading={isPending}
        autoFocus
      />
    </div>
  );
}
