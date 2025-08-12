import { getDivisionInfo } from '@/lib/constants';

interface DivisionProps {
  division: number;
  showName?: boolean;
}

export function Division({ division, showName = true }: DivisionProps) {
  const { name, color } = getDivisionInfo(division);

  return (
    <span className='flex items-center gap-x-2'>
      <span
        className='size-4 rounded-full'
        style={{ backgroundColor: color }}
      />
      {showName && <span className='text-sm'>{name}</span>}
    </span>
  );
}
