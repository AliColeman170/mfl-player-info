'use client';

import { PlayersTableContainer } from '@/app/players-table/components/PlayersTableContainer';
import { TableControlsProvider } from '@/app/players-table/contexts/TableControlsContext';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function Favourites() {
  const searchParams = useSearchParams();
  
  // Set favourites filter when component mounts
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('favourites', 'favourites');
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchParams]);

  return (
    <TableControlsProvider>
      <PlayersTableContainer />
    </TableControlsProvider>
  );
}
