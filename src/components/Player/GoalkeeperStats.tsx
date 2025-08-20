import { Player } from '@/types/global.types';
import { StyledRatingValue } from './StyledRatingValue';

export function GoalkeeperStats({ player }: { player: Player }) {
  return (
    <div className='mt-6'>
      <div className='divide-border divide-y'>
        <div className='text-foreground/80 px-2 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase'>
          GK
        </div>
        <div className='flex justify-center pt-2'>
          <StyledRatingValue rating={player.metadata.goalkeeping} size='lg' />
        </div>
      </div>
    </div>
  );
}
