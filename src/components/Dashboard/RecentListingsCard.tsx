import { DashboardCard } from './DashboardCard';
import { RecentListingsContent } from './RecentListingsContent';
import { Badge } from '@/components/UI/badge';

export function RecentListingsCard() {
  return (
    <DashboardCard
      title='Recent Listings'
      description='Latest players listed for sale on the marketplace'
      headerAction={
        <Badge variant='secondary' className='flex items-center gap-1.5'>
          <div className='relative'>
            <div className='h-2 w-2 rounded-full bg-green-500'></div>
            <div className='absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75'></div>
          </div>
          Live
        </Badge>
      }
    >
      <RecentListingsContent />
    </DashboardCard>
  );
}
