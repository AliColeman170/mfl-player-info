import { Suspense } from 'react';
import { Skeleton } from '@/components/UI/skeleton';
import {
  getContractedPlayers,
  getTotalPlayers,
  getTotalSalesCount,
  getTotalSalesVolume,
} from '@/data/dashboard';
import {
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

function MetricItemSkeleton() {
  return (
    <Card>
      <CardContent className='flex flex-col items-start gap-3.5'>
        <Skeleton className='size-5 flex-shrink-0 rounded' />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <Skeleton className='h-9 w-16' />
          <Skeleton className='h-3.5 w-20' />
        </div>
      </CardContent>
    </Card>
  );
}

function MarketOverviewSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <MetricItemSkeleton key={i} />
      ))}
    </div>
  );
}

function MarketOverviewError({
  title = 'Unable to load',
  className,
}: {
  title?: string;
  className?: string;
}) {
  return (
    <Card className={`${className}`}>
      <CardContent className='flex flex-col items-center gap-3 py-6'>
        <AlertTriangle className='text-destructive size-8' />
        <div className='text-center'>
          <p className='font-medium'>{title}</p>
          <p className='text-muted-foreground text-sm'>
            Please try refreshing the page. Some data may be temporarily
            unavailable.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

async function TotalPlayersContent() {
  const data = await getTotalPlayers();

  if (!data.success) return <MarketOverviewError />;

  return (
    <MetricItem
      icon={<Users className='size-5' />}
      label='Total Players'
      value={data.totalPlayers}
    />
  );
}

export function TotalPlayersCard() {
  return (
    <Suspense fallback={<MetricItemSkeleton />}>
      <TotalPlayersContent />
    </Suspense>
  );
}

async function ContractedPlayersContent() {
  const data = await getContractedPlayers();

  if (!data.success) return <MarketOverviewError />;

  return (
    <MetricItem
      icon={<FileText className='size-5' />}
      label='Contracted Players'
      value={data.contractedPlayers}
    />
  );
}

export function ContractedPlayersCard() {
  return (
    <Suspense fallback={<MetricItemSkeleton />}>
      <ContractedPlayersContent />
    </Suspense>
  );
}

async function TotalSalesVolumeContent() {
  const data = await getTotalSalesVolume();

  if (!data.success) return <MarketOverviewError />;

  return (
    <MetricItem
      icon={<DollarSign className='size-5' />}
      label='Total Sales Volume'
      value={new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
      }).format(data.totalSalesVolume)}
    />
  );
}

export function TotalSalesVolumeCard() {
  return (
    <Suspense fallback={<MetricItemSkeleton />}>
      <TotalSalesVolumeContent />
    </Suspense>
  );
}

async function TotalSalesCountContent() {
  const data = await getTotalSalesCount();

  if (!data.success) return <MarketOverviewError />;

  return (
    <MetricItem
      icon={<ListIcon className='size-5' />}
      label='Total Sales'
      value={data.totalSales}
    />
  );
}

export function TotalSalesCard() {
  return (
    <Suspense fallback={<MetricItemSkeleton />}>
      <TotalSalesCountContent />
    </Suspense>
  );
}
