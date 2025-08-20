import { DashboardCard } from './DashboardCard';
import { RecentSalesContent } from './RecentSalesContent';
import { Badge } from '@/components/UI/badge';

export function RecentSalesCard() {
  return (
    <DashboardCard
      title='Recent Sales'
      description='Latest player transactions from the marketplace'
      headerAction={
        <Badge variant='secondary' className='flex items-center gap-1.5'>
          <div className='relative'>
            <div className='size-2 rounded-full bg-green-500'></div>
            <div className='absolute inset-0 size-2 animate-ping rounded-full bg-green-500 opacity-75'></div>
          </div>
          Live
        </Badge>
      }
    >
      <RecentSalesContent />
    </DashboardCard>
  );
}
