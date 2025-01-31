import { getPlayerPositionRatings } from '@/utils/helpers';
import { Metadata } from 'next';
import {
  ArrowTopRightOnSquareIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';
import { MFLIcon } from '@/components/MFLIcon';
import Link from 'next/link';
import Image from 'next/image';
import { getFavourites } from '@/data/favourites';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { getAllPlayersByOwner } from '@/data/players';
import { TableWrapper } from '@/components/Table/TableWrapper';
import { getUserProfile } from '@/data/user';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const address = (await params).address;
  const user = await getUserProfile(address);
  return {
    title: `${
      user &&
      (user.name
        ? user.name
        : user.discordUser?.username
          ? user.discordUser.username
          : address)
    } | MFL Player Info | Ratings Calculator & Contract Details`,
  };
}

async function fetchPlayersWithFavouriteData(address: string) {
  const supabase = await createClient();
  const favourites = await getFavourites(supabase);

  const players = await getAllPlayersByOwner(address);

  const playersWithAdditionalData: PlayerWithFavouriteData[] = players.map(
    (player) => {
      const faveData = favourites?.find((fave) => fave.player_id === player.id);
      return {
        ...player,
        position_ratings: getPlayerPositionRatings(player, true),
        is_favourite: faveData?.is_favourite ?? false,
        tags: faveData?.tags ?? [],
      };
    }
  );

  return playersWithAdditionalData;
}

export default async function UserPage({ params }: Props) {
  const address = (await params).address;
  const user = await getUserProfile(address);

  if (!user) notFound();

  const players = await fetchPlayersWithFavouriteData(address);

  return (
    <div className='mt-4'>
      {user ? (
        <div className='flex items-start space-x-3 sm:space-x-4'>
          {user.avatar && (
            <Image
              className='h-10 w-10 rounded-full sm:h-12 sm:w-12'
              src={user.avatar}
              width={745}
              height={745}
              alt={
                user.name
                  ? user.name
                  : user.discordUser?.username
                    ? user.discordUser?.username
                    : user.walletAddress
              }
              unoptimized
            />
          )}
          <div className='space-y-2'>
            <h1 className='truncate text-3xl font-bold sm:text-4xl'>
              {user.name
                ? user.name
                : user.discordUser?.username
                  ? user.discordUser?.username
                  : user.walletAddress}
            </h1>
            <div className='flex items-center space-x-2'>
              <div className='inline-flex items-center space-x-2 rounded-md bg-indigo-600 px-3 py-1 text-white'>
                <WalletIcon className='h-4 w-4' />
                <span className='text-xs'>{address}</span>
              </div>
              <Link
                href={`https://app.playmfl.com/users/${address}`}
                className='flex items-center space-x-1 rounded-md bg-slate-800 px-2 text-white ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-900 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-900/60'
              >
                <ArrowTopRightOnSquareIcon className='h-3.5 w-3.5' />
                <MFLIcon className='h-6 w-6' />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <h1 className='text-4xl font-bold'>{address}</h1>
      )}
      <TableWrapper players={players} />
    </div>
  );
}
