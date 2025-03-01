import { Player } from '@/types/global.types';
import { StyledRatingValue } from './StyledRatingValue';

export function GoalkeeperStats({ player }: { player: Player }) {
  return (
    <div className='mt-8'>
      <div className='divide-border divide-y'>
        <div className='text-muted-foreground px-2 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase sm:text-base'>
          GK
        </div>
        <div className='flex justify-center py-4'>
          <StyledRatingValue rating={player.metadata.goalkeeping} />
        </div>
      </div>
    </div>
  );
}
