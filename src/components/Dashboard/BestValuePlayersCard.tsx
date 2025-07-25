import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { PlayerListItem } from './PlayerListItem';
import { Skeleton } from '@/components/UI/skeleton';
import { getBestValuePlayers } from '@/data/dashboard';
import { Target } from 'lucide-react';

function BestValueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function BestValueContent() {
  const players = await getBestValuePlayers(8);

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No player data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => (
        <PlayerListItem
          key={player.id}
          player={player}
          rank={index + 1}
          showValueRatio={true}
        />
      ))}
    </div>
  );
}

export function BestValuePlayersCard() {
  return (
    <DashboardCard
      title="Best Value Players"
      description="Players offering the most overall rating per dollar"
      viewAllHref="/players-table?sort=overall&value_analysis=undervalued"
      viewAllText="View All Bargains"
    >
      <Suspense fallback={<BestValueSkeleton />}>
        <BestValueContent />
      </Suspense>
    </DashboardCard>
  );
}