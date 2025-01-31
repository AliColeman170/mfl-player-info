import { getListingByPlayerId } from '@/data/players';
import { Player } from '@/types/global.types';
import Link from 'next/link';

export async function ForSale({ player }: { player: Player }) {
  const listing = await getListingByPlayerId(player.id);

  if (!listing) return null;

  return (
    <Link
      href={`https://app.playmfl.com/players/${player.id}`}
      className='group relative rounded bg-indigo-500 px-2 py-1.5 text-[10px] font-semibold leading-none text-white ring-1 ring-inset ring-indigo-600 ring-opacity-10'
    >
      <div className='group relative flex justify-center'>
        <span>For Sale</span>
        <span className='absolute bottom-6 w-48 scale-0 rounded-lg bg-slate-950 p-2 text-center text-xs normal-case text-white shadow shadow-slate-300 transition-all group-hover:scale-100 dark:shadow-slate-900'>
          Available to buy for ${listing.price}
        </span>
      </div>
    </Link>
  );
}
