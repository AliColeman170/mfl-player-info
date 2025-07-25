import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { getMarketOverview } from '@/data/dashboard';
import { TrendingUp, Users, ListIcon, FileText, DollarSign } from 'lucide-react';

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

function MetricItem({ icon, label, value, className = "" }: MetricItemProps) {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg bg-muted/50 ${className}`}>
      <div className="flex-shrink-0 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

function MarketOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function MarketOverviewContent() {
  const data = await getMarketOverview();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricItem
        icon={<Users className="h-5 w-5" />}
        label="Total Players"
        value={data.totalPlayers}
      />
      <MetricItem
        icon={<DollarSign className="h-5 w-5" />}
        label="Avg Market Value"
        value={`$${data.avgMarketValue}`}
      />
      <MetricItem
        icon={<ListIcon className="h-5 w-5" />}
        label="Active Listings" 
        value={data.activeListings}
      />
      <MetricItem
        icon={<FileText className="h-5 w-5" />}
        label="Contracted Players"
        value={data.contractedPlayers}
      />
      <MetricItem
        icon={<TrendingUp className="h-5 w-5" />}
        label="Total Market Cap"
        value={`$${(data.totalMarketCap / 1000000).toFixed(1)}M`}
        className="md:col-span-2 lg:col-span-1"
      />
    </div>
  );
}

export function MarketOverviewCard() {
  return (
    <DashboardCard
      title="Market Overview"
      description="Current market statistics and player data"
      headerAction={<Badge variant="secondary">Live</Badge>}
    >
      <Suspense fallback={<MarketOverviewSkeleton />}>
        <MarketOverviewContent />
      </Suspense>
    </DashboardCard>
  );
}