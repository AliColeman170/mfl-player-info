import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { Skeleton } from '@/components/UI/skeleton';
import { Badge } from '@/components/UI/badge';
import { getRecentSales } from '@/data/dashboard';
import { Clock, DollarSign } from 'lucide-react';

function RecentSalesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentSalesContent() {
  const sales = await getRecentSales(8);

  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent sales data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const player = sale.player;
        const purchaseDate = sale.purchaseDateTime 
          ? new Date(sale.purchaseDateTime * 1000)
          : null;

        return (
          <div
            key={`${sale.listingResourceId}-${sale.purchaseDateTime}`}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {player?.metadata?.firstName?.[0] || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">
                  {player?.metadata ? 
                    `${player.metadata.firstName} ${player.metadata.lastName}` : 
                    'Unknown Player'
                  }
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {player?.metadata?.overall && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {player.metadata.overall} OVR
                    </Badge>
                  )}
                  {player?.metadata?.positions?.[0] && (
                    <span>{player.metadata.positions[0]}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {sale.price.toLocaleString()}
              </p>
              {purchaseDate && (
                <p className="text-xs text-muted-foreground">
                  {purchaseDate.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RecentSalesCard() {
  return (
    <DashboardCard
      title="Recent Sales"
      description="Latest player transactions from the marketplace"
      viewAllHref="/players-table?sort=last_sale_date"
      viewAllText="View All Sales"
    >
      <Suspense fallback={<RecentSalesSkeleton />}>
        <RecentSalesContent />
      </Suspense>
    </DashboardCard>
  );
}