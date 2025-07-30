'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { usePlayerQuery } from '@/hooks/usePlayerQuery';
import { Loader2Icon } from 'lucide-react';
import { PlayerSwapCommand } from './PlayerSwapCommand';
import { ComparePlayerCard } from './ComparePlayerCard';
import { PlayerStatsComparison } from './PlayerStatsComparison';
import { PositionalFamiliarityToggleWrapper } from './PositionalFamiliarityToggleWrapper';
import { useTransition } from 'react';

export function ClientComparePage() {
  const [player1Loading, loadPlayer1] = useTransition();
  const [player2Loading, loadPlayer2] = useTransition();

  // Use nuqs for URL state management
  const [player1Id, setPlayer1Id] = useQueryState(
    'player1',
    parseAsInteger.withDefault(0)
  );
  const [player2Id, setPlayer2Id] = useQueryState(
    'player2',
    parseAsInteger.withDefault(0)
  );

  // React Query for player data
  const {
    data: player1,
    isLoading: isLoading1,
    error: error1,
  } = usePlayerQuery(player1Id || 0);

  const {
    data: player2,
    isLoading: isLoading2,
    error: error2,
  } = usePlayerQuery(player2Id || 0);

  const handlePlayer1Change = (id: number) => {
    if (id) {
      loadPlayer1(() => {
        setPlayer1Id(id);
      });
    }
  };

  const handlePlayer2Change = (id: number) => {
    if (id) {
      loadPlayer2(() => {
        setPlayer2Id(id);
      });
    }
  };

  // Helper function to render player card content
  const renderPlayerCard = (
    player: any,
    playerId: number,
    isLoading: boolean,
    error: any,
    transitionLoading: boolean
  ) => {
    if (transitionLoading || (isLoading && playerId !== 0)) {
      return (
        <div className='flex h-32 items-center justify-center'>
          <Loader2Icon className='size-6 animate-spin' />
        </div>
      );
    }

    if (error && playerId !== 0) {
      return (
        <div className='flex h-32 items-center justify-center text-red-500'>
          <div className='text-center'>
            <div className='mb-1 text-sm font-medium'>Error loading player</div>
            <div className='text-xs'>Please try selecting another player</div>
          </div>
        </div>
      );
    }

    if (player && playerId !== 0) {
      return <ComparePlayerCard playerId={playerId} />;
    }

    // Default empty state
    return (
      <div className='flex h-32 items-center justify-center text-gray-500'>
        <div className='text-center'>
          <div className='mb-2 text-lg font-medium'>No Player Selected</div>
          <div className='text-sm'>Use the swap button to select a player</div>
        </div>
      </div>
    );
  };

  return (
    <div className='container mx-auto py-8'>
      {/* Header */}
      <div className='mb-8 text-center'>
        <h1 className='mb-2 text-3xl font-bold'>Player Comparison</h1>
        <p className='text-muted-foreground'>
          Compare stats, ratings, and performance between players
        </p>
      </div>

      {/* Player Cards */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Player 1 */}
        <div className='relative'>
          <PlayerSwapCommand
            currentPlayerId={player1Id || undefined}
            playerLabel='Player 1'
            onPlayerSelect={handlePlayer1Change}
          />
          <div className='bg-background shadow-foreground/2 border-border @container/main mx-auto w-full max-w-xl transform rounded-xl border p-4 shadow-2xl sm:p-6 lg:px-8 lg:pb-8'>
            {renderPlayerCard(
              player1,
              player1Id,
              isLoading1,
              error1,
              player1Loading
            )}
          </div>
        </div>

        {/* Player 2 */}
        <div className='relative'>
          <PlayerSwapCommand
            currentPlayerId={player2Id || undefined}
            playerLabel='Player 2'
            onPlayerSelect={handlePlayer2Change}
          />
          <div className='bg-background shadow-foreground/2 border-border @container/main mx-auto w-full max-w-xl transform rounded-xl border p-4 shadow-2xl sm:p-6 lg:px-8 lg:pb-8'>
            {renderPlayerCard(
              player2,
              player2Id,
              isLoading2,
              error2,
              player2Loading
            )}
          </div>
        </div>
      </div>

      {/* Comparison Tables */}
      {player1 && player2 && (
        <div className='space-y-8'>
          <PlayerStatsComparison player1={player1} player2={player2} />
          <PositionalFamiliarityToggleWrapper
            player1={player1}
            player2={player2}
          />
        </div>
      )}
    </div>
  );
}
