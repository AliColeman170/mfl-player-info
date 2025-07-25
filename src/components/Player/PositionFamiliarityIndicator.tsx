import { positionalFamiliarity } from '@/config';
import { Player } from '@/types/global.types';
import { Badge } from '../UI/badge';

export function PositionFamiliarityIndicator({
  positions,
  player,
}: {
  positions: string[];
  player: Player;
}) {
  if (positions.includes(player.metadata.positions[0])) {
    return (
      <Badge className='rounded-sm px-1.5 text-[10px]/2.5 font-medium'>P</Badge>
    );
  }
  if (
    positions.includes(player.metadata.positions[1]) ||
    positions.includes(player.metadata.positions[2])
  ) {
    return (
      <Badge
        variant='secondary'
        className='rounded-sm px-1.5 text-[10px]/2.5 font-medium'
      >
        S
      </Badge>
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
      <Badge
        title='Secondary'
        className='rounded-sm bg-lime-700 px-1.5 text-[10px]/2.5 font-medium text-white'
      >
        S
      </Badge>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -20
  ) {
    return (
      <Badge
        title='Unfamiliar'
        className='rounded-sm bg-red-700 px-1 text-[10px]/2.5 font-medium text-white'
      >
        U
      </Badge>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -8
  ) {
    return (
      <Badge
        title='Somewhat Familiar'
        className='rounded-sm bg-amber-700 px-1 text-[10px]/2.5 font-medium text-white'
      >
        SF
      </Badge>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      -5
  ) {
    return (
      <Badge
        title='Fairly Familiar'
        className='rounded-sm bg-yellow-500 px-1 text-[10px]/2.5 font-medium text-white'
      >
        FF
      </Badge>
    );
  }
  if (
    familiarity &&
    familiarity.adjustment[position as keyof typeof familiarity.adjustment] ===
      0
  ) {
    return (
      <Badge
        title='Primary'
        className='rounded-sm bg-green-700 px-1 text-[10px]/2.5 font-medium text-white'
      >
        P
      </Badge>
    );
  }
  return null;
}
