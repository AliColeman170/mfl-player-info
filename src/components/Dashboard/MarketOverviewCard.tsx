import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { getMarketOverview } from '@/data/dashboard';
import {
  TrendingUp,
  Users,
  ListIcon,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '../UI/card';

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

function MetricItem({ icon, label, value, className = '' }: MetricItemProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className='flex flex-col items-start gap-2'>
        <div className='text-primary flex-shrink-0'>{icon}</div>
        <div className='min-w-0 flex-1'>
          <p className='text-4xl font-bold'>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className='text-muted-foreground text-sm font-medium'>{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketOverviewSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className='flex flex-col items-start gap-3.5'>
            <Skeleton className='size-5 flex-shrink-0 rounded' />
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
              <Skeleton className='h-9 w-16' />
              <Skeleton className='h-3.5 w-20' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function MarketOverviewContent() {
  const data = await getMarketOverview();

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <MetricItem
        icon={<Users className='size-5' />}
        label='Total Players'
        value={data.totalPlayers}
      />
      <MetricItem
        icon={<DollarSign className='size-5' />}
        label='Avg Market Value'
        value={`$${data.avgMarketValue}`}
      />
      <MetricItem
        icon={<ListIcon className='size-5' />}
        label='Active Listings'
        value={data.activeListings}
      />
      <MetricItem
        icon={<FileText className='size-5' />}
        label='Contracted Players'
        value={data.contractedPlayers}
      />
    </div>
  );
}

export function MarketOverviewCard() {
  return (
    <Suspense fallback={<MarketOverviewSkeleton />}>
      <MarketOverviewContent />
    </Suspense>
  );
}
