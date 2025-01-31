import { PlayerCard } from './PlayerCard';
import { NotFound } from '../Player/NotFound';
import { PlayerStatsComparison } from './PlayerStatsComparison';
import { PositionalFamiliarityToggleWrapper } from './PositionalFamiliarityToggleWrapper';
import { getPlayerById } from '@/data/players';

export async function PlayerComparison({
  player1Id,
  player2Id,
}: {
  player1Id: number;
  player2Id: number;
}) {
  const player1 = await getPlayerById(player1Id);
  const player2 = await getPlayerById(player2Id);

  return (
    <div className='grid w-full max-w-5xl grid-cols-2 place-items-center gap-4 md:gap-8'>
      {player1Id && (player1 ? <PlayerCard player={player1} /> : <NotFound />)}
      {player2Id && (player2 ? <PlayerCard player={player2} /> : <NotFound />)}
      {player1 && player2 && (
        <>
          <PlayerStatsComparison player1={player1} player2={player2} />
          <PositionalFamiliarityToggleWrapper
            player1={player1}
            player2={player2}
          />
        </>
      )}
    </div>
  );
}
