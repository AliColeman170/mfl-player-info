import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '../UI/badge';
import { ShieldOffIcon, TrendingUpIcon } from 'lucide-react';
import { Club } from '@/types/global.types';
import { cn } from '@/lib/utils';

export function PlayerContract({
  club,
  className,
}: {
  club?: Pick<Club, 'id' | 'name' | 'type'>;
  className?: string | undefined;
}) {
  if (!club)
    return (
      <Badge
        variant='outline'
        className={cn('text-[10px] [&>svg]:size-2.5', className)}
      >
        <ShieldOffIcon className='shrink-0' />
        Free Agent
      </Badge>
    );

  if (club.type === 'DEVELOPMENT_CENTER') {
    return (
      <Badge
        className={cn(
          'bg-yellow-300 text-[10px] text-black [&>svg]:size-2.5',
          className
        )}
      >
        <TrendingUpIcon className='shrink-0' />
        <span className='truncate text-ellipsis'>Development Center</span>
      </Badge>
    );
  }

  return (
    <Link href={`https://app.playmfl.com/clubs/${club.id}`}>
      <Badge
        variant='outline'
        className={cn(
          'bg-background flex items-center gap-1 text-[10px]',
          className
        )}
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
