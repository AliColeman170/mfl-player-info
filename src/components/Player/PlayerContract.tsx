import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '../UI/badge';
import { ShieldOffIcon, TrendingUpIcon } from 'lucide-react';
import { Club } from '@/types/global.types';

export function PlayerContract({
  club,
}: {
  club?: Pick<Club, 'id' | 'name' | 'type'>;
}) {
  if (!club)
    return (
      <Badge variant='outline' className='text-[10px] [&>svg]:size-2.5'>
        <ShieldOffIcon className='shrink-0' />
        Free Agent
      </Badge>
    );

  if (club.type === 'DEVELOPMENT_CENTER') {
    return (
      <Badge className='bg-yellow-300 text-[10px] text-black [&>svg]:size-2.5'>
        <TrendingUpIcon className='shrink-0' />
        <span className='truncate text-ellipsis'>Development Center</span>
      </Badge>
    );
  }

  return (
    <Link href={`https://app.playmfl.com/clubs/${club.id}`}>
      <Badge
        variant='outline'
        className='bg-background flex items-center gap-1 text-[10px]'
      >
        <Image
          src={`https://d13e14gtps4iwl.cloudfront.net/u/clubs/${club.id}/logo.png?v=1`}
          className='size-3'
          alt={club.name}
          width={100}
          height={100}
          unoptimized
        />
        <span className='truncate text-ellipsis'>{club.name}</span>
      </Badge>
    </Link>
  );
}
