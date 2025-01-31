import { Player } from '@/types/global.types';
import Image from 'next/image';
import Link from 'next/link';

export async function PlayerContract({ player }: { player: Player }) {
  const { activeContract } = player;
  if (!activeContract)
    return (
      <div className='group relative rounded bg-slate-100 px-2 py-1.5 text-[10px] font-semibold leading-none text-slate-700 ring-1 ring-inset ring-indigo-600 ring-opacity-10 dark:bg-gray-800 dark:text-white'>
        Free Agent
      </div>
    );

  return (
    <Link
      href={`https://app.playmfl.com/clubs/${activeContract.club.id}`}
      style={{
        backgroundColor: activeContract.club.mainColor,
      }}
      className='group relative flex items-center gap-1.5 truncate rounded px-2 py-1.5 text-[10px]'
    >
      {activeContract.club.type !== 'DEVELOPMENT_CENTER' && (
        <Image
          src={`https://d13e14gtps4iwl.cloudfront.net/u/clubs/${activeContract.club.id}/logo.png?v=1`}
          className='h-3.5 w-3.5'
          alt={activeContract.club.name}
          width={100}
          height={100}
          unoptimized
        />
      )}
      <span
        style={{
          color: activeContract.club.mainColor,
        }}
        className='truncate font-medium leading-snug contrast-[999] grayscale invert'
      >
        {activeContract.club.name}
      </span>
    </Link>
  );
}
