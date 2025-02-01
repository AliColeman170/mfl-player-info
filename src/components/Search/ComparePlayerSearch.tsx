'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { SearchComboBox } from './SearchComboBox';
import { Player } from '@/types/global.types';

export function ComparePlayerSearch({
  player1,
  player2,
}: {
  player1: number;
  player2: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [player1Loading, loadPlayer1] = useTransition();
  const [player2Loading, loadPlayer2] = useTransition();

  function handlePlayer1Change(id: number) {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('player1', id.toString());
    }
    loadPlayer1(() => {
      router.push(`/compare?${params.toString()}`);
    });
  }

  function handlePlayer2Change(id: number) {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('player2', id.toString());
    }
    loadPlayer2(() => {
      router.push(`/compare?${params.toString()}`);
    });
  }

  return (
    <div className='grid w-full max-w-5xl grid-cols-2 place-items-center gap-x-4 md:gap-x-8'>
      <div className='w-full max-w-xl'>
        <div className='relative'>
          <SearchComboBox
            key='player-1'
            id={player1}
            handlePlayerChange={handlePlayer1Change}
            isLoading={player1Loading}
          />
        </div>
      </div>
      <div className='w-full max-w-xl'>
        <div className='relative'>
          <SearchComboBox
            key='player-2'
            id={player2}
            handlePlayerChange={handlePlayer2Change}
            isLoading={player2Loading}
          />
        </div>
      </div>
    </div>
  );
}
