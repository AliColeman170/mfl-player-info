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
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/UI/card';
import { getUser } from '@/data/auth';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default async function Home() {
  const supabase = await createClient();

  const user = await getUser(supabase);

  const { data } = await supabase
    .from('sync_config')
    .select('config_value')
    .eq('config_key', 'initial_sync_in_progress')
    .single();

  if (
    data?.config_value === '1' &&
    user?.app_metadata.address !== '0xb6fbc6072df85634'
  )
    return;
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
