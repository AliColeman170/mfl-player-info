import { Suspense } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { MarketValue } from './MarketValue';
import Link from 'next/link';
import { PlayerTags } from './PlayerTags';
import { Player } from '@/types/global.types';

export async function BasicInfo({ player }: { player: Player }) {
  const { firstName, lastName, age, height, preferredFoot, positions } =
    player.metadata;
  const fullName = `${firstName} ${lastName}`;
  const metadata = {
    age,
    height: `${height}cm`,
    foot: preferredFoot.toLowerCase(),
    position: positions.join(' / '),
  };
  return (
    <div className='col-start-1 @sm/main:col-span-2 @sm/main:col-start-2'>
      <dl className='divide-y divide-slate-200 @container/inner dark:divide-slate-700'>
        <div className='grid gap-y-1 px-1 py-2 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
          <dt className='text-xs font-semibold uppercase leading-none text-slate-700 @[16rem]/inner:text-base dark:text-slate-400'>
            Name
          </dt>
          <dd className='col-span-2 text-sm capitalize leading-none text-slate-700 @[10rem]/inner:text-right @[16rem]/inner:text-base dark:text-slate-200'>
            <Link
              href={`/player/${player.id}`}
              className='text-indigo-500 hover:text-indigo-400'
            >
              {fullName}
            </Link>
          </dd>
        </div>
        {Object.entries(metadata).map(([key, value]) => (
          <div
            key={key}
            className='grid gap-y-1 px-1 py-2 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'
          >
            <dt className='text-xs font-semibold uppercase leading-none text-slate-700 @[16rem]/inner:text-base dark:text-slate-400'>
              {key}
            </dt>
            <dd className='col-span-2 text-sm capitalize leading-none text-slate-700 @[10rem]/inner:text-right @[16rem]/inner:text-base dark:text-slate-200'>
              {value}
            </dd>
          </div>
        ))}
        <div className='grid px-1 py-1.5 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
          <dt className='flex items-center space-x-2 text-xs font-semibold uppercase leading-none text-slate-700 @[16rem]/inner:text-base dark:text-slate-400'>
            <span>Value</span>
            <div className='group relative flex justify-center'>
              <button>
                <InformationCircleIcon className='h-5 w-5 text-slate-500' />
              </button>
              <span className='absolute bottom-6 w-48 scale-0 rounded-lg bg-slate-950 p-2 text-center text-xs normal-case text-white shadow shadow-slate-300 transition-all group-hover:scale-100 dark:shadow-slate-900'>
                Based on average of last 3 sales for similar age, rating and
                position.
              </span>
            </div>
          </dt>
          <dd className='col-span-2 flex flex-wrap items-center gap-2 text-left text-sm capitalize leading-none text-slate-700 @[10rem]/inner:justify-end @[10rem]/inner:text-right @[16rem]/inner:text-base dark:text-slate-200'>
            <Suspense
              fallback={
                <SpinnerIcon className='h-4 w-4 animate-spin text-slate-400' />
              }
            >
              <MarketValue player={player} />
            </Suspense>
          </dd>
        </div>
        <PlayerTags player={player} />
      </dl>
    </div>
  );
}
