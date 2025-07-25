import { Metadata } from 'next';
import { MarketOverviewCard } from '@/components/Dashboard/MarketOverviewCard';
import { RecentSalesCard } from '@/components/Dashboard/RecentSalesCard';
import { TopPlayersByValueCard } from '@/components/Dashboard/TopPlayersByValueCard';
import { BestValuePlayersCard } from '@/components/Dashboard/BestValuePlayersCard';
import { RisingStarsCard } from '@/components/Dashboard/RisingStarsCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">MFL Player Info</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover, analyze, and track Metaverse Football League players with comprehensive market data and insights.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Overview - Full width on mobile, spans 12 cols on large screens */}
        <div className="lg:col-span-12">
          <MarketOverviewCard />
        </div>

        {/* Recent Sales - Left column on large screens */}
        <div className="lg:col-span-6">
          <RecentSalesCard />
        </div>

        {/* Top Players by Value - Right column on large screens */}
        <div className="lg:col-span-6">
          <TopPlayersByValueCard />
        </div>

        {/* Best Value Players - Left column */}
        <div className="lg:col-span-6">
          <BestValuePlayersCard />
        </div>

        {/* Rising Stars - Right column */}
        <div className="lg:col-span-6">
          <RisingStarsCard />
        </div>
      </div>
    </div>
  );
}
