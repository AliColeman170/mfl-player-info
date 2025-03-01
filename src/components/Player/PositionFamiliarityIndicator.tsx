import { positionalFamiliarity } from '@/config';
import { Player } from '@/types/global.types';

export function PositionFamiliarityIndicator({
  positions,
  player,
}: {
  positions: string[];
  player: Player;
}) {
  if (positions.includes(player.metadata.positions[0])) {
    return (
      <span className='inline-flex items-center justify-center rounded-sm bg-indigo-600 px-2 py-1 text-[10px] leading-none text-white'>
        P
      </span>
    );
  }
  if (
    positions.includes(player.metadata.positions[1]) ||
    positions.includes(player.metadata.positions[2])
  ) {
    return (
      <span className='inline-flex items-center justify-center rounded-sm bg-slate-300 px-2 py-1 text-[10px] leading-none text-slate-900'>
        S
      </span>
    );
  }
  return null;
}

export function PositionalFamiliarityIndicator({
  position,
  player,
}: {
  position: string;
  player: Player;
}) {
  const familiarity = positionalFamiliarity.find(
    (pos) => pos.primaryPosition === player.metadata.positions[0]
  );
  if (player.metadata.positions.slice(1).includes(position)) {
    return (
      <span
        title='Secondary'
        className='inline-flex items-center justify-center rounded-sm bg-lime-700 px-2 py-1 text-[10px] leading-none text-white'
      >
        S
      </span>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -20
  ) {
    return (
      <span
        title='Unfamiliar'
        className='inline-flex items-center justify-center rounded-sm bg-red-700 px-2 py-1 text-[10px] leading-none text-white'
      >
        U
      </span>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -8
  ) {
    return (
      <span
        title='Somewhat Familiar'
        className='inline-flex items-center justify-center rounded-sm bg-amber-600 px-2 py-1 text-[10px] leading-none text-white'
      >
        SF
      </span>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -5
  ) {
    return (
      <span
        title='Fairly Familiar'
        className='inline-flex items-center justify-center rounded-sm bg-yellow-500 px-2 py-1 text-[10px] leading-none text-white'
      >
        FF
      </span>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      0
  ) {
    return (
      <span
        title='Primary'
        className='inline-flex items-center justify-center rounded-sm bg-green-700 px-2 py-1 text-[10px] leading-none text-white'
      >
        P
      </span>
    );
  }
  return null;
}
