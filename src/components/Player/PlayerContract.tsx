import { Player } from '@/types/global.types';
import { ArrowTrendingUpIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';

export async function PlayerContract({ player }: { player: Player }) {
  const { activeContract } = player;
  if (!activeContract)
    return (
      <div className='flex items-center rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20'>
        Free Agent
      </div>
    );

  if (activeContract.club.type === 'DEVELOPMENT_CENTER') {
    return (
      <div className='flex max-w-full items-center justify-center gap-1.5 rounded-md bg-yellow-300 px-2 py-1 text-[10px] font-medium text-black ring-1 ring-yellow-900/10 ring-inset dark:bg-yellow-400/10 dark:text-yellow-400 dark:ring-yellow-400/20'>
        <ArrowTrendingUpIcon className='size-3.5 shrink-0' />
        <span className='truncate text-ellipsis'>Development Center</span>
      </div>
    );
  }

  return (
    <Link
      href={`https://app.playmfl.com/clubs/${activeContract.club.id}`}
      className='flex items-center gap-x-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-slate-900 ring-1 ring-slate-200 ring-inset dark:text-white dark:ring-slate-800'
    >
      <Image
        src={`https://d13e14gtps4iwl.cloudfront.net/u/clubs/${activeContract.club.id}/logo.png?v=1`}
        className='size-3.5'
        alt={activeContract.club.name}
        width={100}
        height={100}
        unoptimized
      />
      <span className='truncate text-ellipsis'>{activeContract.club.name}</span>
    </Link>
  );
}
