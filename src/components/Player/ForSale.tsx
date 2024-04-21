import Link from 'next/link';

async function getListingData(id) {
  const playerData = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${id}`
  ).then((res) => res.json());

  if (playerData.listing) return playerData.listing;

  return null;
}

export async function ForSale({ player }) {
  const listingData = await getListingData(player);
  if (!listingData) return null;

  return (
    <Link
      href={`https://app.playmfl.com/players/${player}`}
      className='group relative rounded bg-indigo-500 px-2 py-1.5 text-[10px] font-semibold leading-none text-white ring-1 ring-inset ring-indigo-600 ring-opacity-10'
    >
      <div className='group relative flex justify-center'>
        <span>For Sale</span>
        <span className='absolute bottom-6 w-48 scale-0 rounded-lg bg-slate-950 p-2 text-center text-xs normal-case text-white shadow shadow-slate-300 transition-all group-hover:scale-100 dark:shadow-slate-900'>
          Available to buy for ${listingData.price}
        </span>
      </div>
    </Link>
  );
}
