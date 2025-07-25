import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { PlayerListItem } from './PlayerListItem';
import { Skeleton } from '@/components/UI/skeleton';
import { getTopPlayersByValue } from '@/data/dashboard';
import { Trophy } from 'lucide-react';

function TopPlayersSkeleton() {
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
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function TopPlayersContent() {
  const players = await getTopPlayersByValue(8);

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
        />
      ))}
    </div>
  );
}

export function TopPlayersByValueCard() {
  return (
    <DashboardCard
      title="Top Players by Value"
      description="Highest valued players in the marketplace"
      viewAllHref="/players-table?sort=market_value_estimate"
      viewAllText="View All Players"
    >
      <Suspense fallback={<TopPlayersSkeleton />}>
        <TopPlayersContent />
      </Suspense>
    </DashboardCard>
  );
}