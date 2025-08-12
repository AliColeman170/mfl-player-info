'use client';

import { PlayersTableContainer } from '@/app/players-table/components/PlayersTableContainer';
import { TableControlsProvider } from '@/app/players-table/contexts/TableControlsContext';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface UserPlayersTableProps {
  walletAddress: string;
}

export function UserPlayersTable({ walletAddress }: UserPlayersTableProps) {
  const searchParams = useSearchParams();
  
  // Set wallet address filter when component mounts
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('walletAddress', walletAddress);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchParams, walletAddress]);

  return (
    <TableControlsProvider>
      <PlayersTableContainer />
    </TableControlsProvider>
  );
}