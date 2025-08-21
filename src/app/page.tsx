import type { Metadata } from 'next';
import {
  ContractedPlayersCard,
  TotalPlayersCard,
  TotalSalesCard,
  TotalSalesVolumeCard,
} from '@/components/Dashboard/MarketOverviewCard';
import { RecentSalesCard } from '@/components/Dashboard/RecentSalesCard';
import { RecentListingsCard } from '@/components/Dashboard/RecentListingsCard';
import { TopRatedPlayersCard } from '@/components/Dashboard/TopRatedPlayersCard';
import { FavoritePlayersCard } from '@/components/Dashboard/FavoritePlayersCard';
import { TopOwnersCard } from '@/components/Dashboard/TopOwnersCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default async function Home() {
  return (
    <div className='container mx-auto flex flex-col gap-y-8'>
      {/* Dashboard Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        {/* Market Overview - Full width on mobile, spans 12 cols on large screens */}
        <div className='lg:col-span-12'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <TotalPlayersCard />
            <ContractedPlayersCard />
            <TotalSalesVolumeCard />
            <TotalSalesCard />
          </div>
        </div>

        {/* Top Rated Players - 3-column layout */}
        <div className='lg:col-span-4'>
          <TopRatedPlayersCard />
        </div>

        {/* Favorite Players - 3-column layout */}
        <div className='lg:col-span-4'>
          <FavoritePlayersCard />
        </div>

        {/* Top Owners - 3-column layout */}
        <div className='lg:col-span-4'>
          <TopOwnersCard />
        </div>

        {/* Recent Sales - Left column on large screens */}
        <div className='lg:col-span-6'>
          <RecentSalesCard />
        </div>

        {/* Recent Listings - Right column on large screens */}
        <div className='lg:col-span-6'>
          <RecentListingsCard />
        </div>
      </div>
    </div>
  );
}
