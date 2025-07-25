import { Badge } from '@/components/UI/badge';
import { DollarSign } from 'lucide-react';
import { TopPlayer } from '@/data/dashboard';

interface PlayerListItemProps {
  player: TopPlayer;
  rank: number;
  showValueRatio?: boolean;
}

export function PlayerListItem({ player, rank, showValueRatio = false }: PlayerListItemProps) {
  const displayName = player.first_name && player.last_name 
    ? `${player.first_name} ${player.last_name}`
    : `Player #${player.id}`;

  const valueRatio = showValueRatio && player.overall && player.market_value_estimate
    ? (player.overall / player.market_value_estimate * 1000).toFixed(2)
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">#{rank}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-xs font-semibold">
              {player.first_name?.[0] || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {player.overall && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {player.overall} OVR
                </Badge>
              )}
              {player.primary_position && (
                <span>{player.primary_position}</span>
              )}
              {player.age && (
                <span>Age {player.age}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {player.market_value_estimate?.toLocaleString() || 'N/A'}
        </p>
        {valueRatio && (
          <p className="text-xs text-muted-foreground">
            {valueRatio} pts/$k
          </p>
        )}
        {player.club_name && (
          <p className="text-xs text-muted-foreground truncate max-w-24">
            {player.club_name}
          </p>
        )}
      </div>
    </div>
  );
}