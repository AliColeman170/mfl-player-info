import { Metadata } from 'next';
import { MarketOverviewCard } from '@/components/Dashboard/MarketOverviewCard';
import { RecentSalesCard } from '@/components/Dashboard/RecentSalesCard';
import { RecentListingsCard } from '@/components/Dashboard/RecentListingsCard';
import { TopRatedPlayersCard } from '@/components/Dashboard/TopRatedPlayersCard';
import { FavoritePlayersCard } from '@/components/Dashboard/FavoritePlayersCard';
import { TopOwnersCard } from '@/components/Dashboard/TopOwnersCard';
import { SyncStatusCard } from '@/components/Dashboard/SyncStatusCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default function Home() {
  return (
    <div className='container mx-auto flex flex-col gap-y-8'>
      {/* Dashboard Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        {/* Market Overview - Full width on mobile, spans 12 cols on large screens */}
        <div className='lg:col-span-12'>
          <MarketOverviewCard />
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

        {/* Sync Status - Full width */}
        <div className='lg:col-span-12'>
          <SyncStatusCard />
        </div>
      </div>
    </div>
  );
}
