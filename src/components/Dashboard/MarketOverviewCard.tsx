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
  AlertTriangle,
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

function MarketOverviewError() {
  return (
    <Card className='col-span-full'>
      <CardContent className='flex flex-col items-center gap-3 py-6'>
        <AlertTriangle className='size-8 text-destructive' />
        <div className='text-center'>
          <p className='font-medium'>Unable to load market overview</p>
          <p className='text-muted-foreground text-sm'>
            Please try refreshing the page. Some data may be temporarily unavailable.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

async function MarketOverviewContent() {
  try {
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
          label='Total Sales Volume'
          value={`$${data.totalSalesVolume.toLocaleString()}`}
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
  } catch (error) {
    console.error('Error in MarketOverviewContent:', error);
    return <MarketOverviewError />;
  }
}

export function MarketOverviewCard() {
  return (
    <Suspense fallback={<MarketOverviewSkeleton />}>
      <MarketOverviewContent />
    </Suspense>
  );
}
