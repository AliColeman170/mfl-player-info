import { Suspense } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { MarketValue, getMarketValueTooltip } from './MarketValue';
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
  
  // Get dynamic tooltip text for market value
  const tooltipText = await getMarketValueTooltip(player);
  return (
    <div className='col-start-1 @sm/main:col-span-2 @sm/main:col-start-2'>
      <dl className='divide-border @container/inner divide-y'>
        <div className='grid gap-y-1 px-1 py-2 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
          <dt className='text-muted-foreground text-xs leading-none font-semibold uppercase @[16rem]/inner:text-base'>
            Name
          </dt>
          <dd className='col-span-2 text-sm leading-none capitalize @[10rem]/inner:text-right @[16rem]/inner:text-base'>
            <Link
              href={`/player/${player.id}`}
              className='text-primary hover:text-primary/80'
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
            <dt className='text-muted-foreground text-xs leading-none font-semibold uppercase @[16rem]/inner:text-base'>
              {key}
            </dt>
            <dd className='col-span-2 text-sm leading-none capitalize @[10rem]/inner:text-right @[16rem]/inner:text-base'>
              {value}
            </dd>
          </div>
        ))}
        <div className='grid px-1 py-1.5 @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0 @[16rem]/inner:py-2'>
          <dt className='text-muted-foreground flex items-center space-x-2 text-xs leading-none font-semibold uppercase @[16rem]/inner:text-base'>
            <span>Value</span>
            <div className='group relative flex justify-center'>
              <button>
                <InformationCircleIcon className='text-muted-foreground size-5' />
              </button>
              <span className='bg-background text-foreground shadow-foreground/5 absolute bottom-6 w-64 scale-0 rounded-lg p-2 text-center text-xs normal-case shadow-sm transition-all group-hover:scale-100'>
                {tooltipText}
              </span>
            </div>
          </dt>
          <dd className='col-span-2 flex flex-wrap items-center gap-2 text-left text-sm leading-none capitalize @[10rem]/inner:justify-end @[10rem]/inner:text-right @[16rem]/inner:text-base'>
            <Suspense
              fallback={
                <SpinnerIcon className='text-muted size-4 animate-spin' />
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
