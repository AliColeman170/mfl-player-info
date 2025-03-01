import { getListingByPlayerId } from '@/data/players';
import { Player } from '@/types/global.types';
import { ShoppingCartIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

export async function ForSale({ player }: { player: Player }) {
  const listing = await getListingByPlayerId(player.id);

  if (!listing) return null;

  return (
    <Link
      href={`https://app.playmfl.com/players/${player.id}`}
      className='group inline-flex items-center rounded-md bg-indigo-500 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-indigo-900/10 ring-inset dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30'
    >
      <div className='relative flex items-center justify-center gap-1.5'>
        <ShoppingCartIcon className='size-3' />
        <span>For Sale</span>
        <span className='absolute bottom-6 w-48 scale-0 rounded-lg bg-slate-950 p-2 text-center text-xs text-white normal-case shadow-sm shadow-slate-300 transition-all group-hover:scale-100 dark:shadow-slate-900'>
          Available to buy for ${listing.price}
        </span>
      </div>
    </Link>
  );
}
