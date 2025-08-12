'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Player } from '@/types/global.types';
import { ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '../UI/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/UI/collapsible';
import { Division } from '@/components/UI/Division';
import { formatPercentage } from '@/lib/formatters';

interface ContractStatsRow {
  division: number;
  total_contracts: number;
  min_revenue_share: number;
  max_revenue_share: number;
  avg_revenue_share: number;
}

async function fetchContractStats(
  playerId: number
): Promise<ContractStatsRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_contract_stats_for_player', {
    player_id: playerId,
  });

  if (error) {
    throw new Error(`Failed to fetch contract stats: ${error.message}`);
  }

  return (data as ContractStatsRow[]) || [];
}

export function ContractStats({ player }: { player: Player }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: contractStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract-stats', player.id],
    queryFn: () => fetchContractStats(player.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className='mt-6'>
        <div className='bg-card border-border -mx-3 flex items-center justify-between rounded-md border px-3 py-2'>
          <div className='flex items-center gap-2'>
            <h2 className='ml-1 text-base font-semibold'>Contract Info</h2>
          </div>
          <Button variant='ghost' size='sm' className='p-1' disabled>
            <ChevronsUpDownIcon />
            <span className='sr-only'>Toggle</span>
          </Button>
        </div>
        <div className='text-muted-foreground mt-4 text-sm'>
          Loading contract data...
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Contract stats error:', error);
    return null;
  }

  if (!contractStats || contractStats.length === 0) {
    return null;
  }

  return (
    <div className='mt-6'>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className='bg-card border-border flex items-center justify-between rounded-md border py-1.5 pr-2 pl-4'>
            <div className='flex items-center gap-1.5'>
              <h2 className='text-base font-semibold'>Contract Info</h2>
            </div>
            <Button variant='ghost' size='sm' className='p-1'>
              <ChevronsUpDownIcon />
              <span className='sr-only'>Toggle</span>
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='mt-4 flex flex-col gap-4'>
            <div className='space-y-2'>
              {contractStats.map((stat) => (
                <div
                  key={stat.division}
                  className='bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2'
                >
                  <div className='flex items-center gap-1.5'>
                    <Division division={stat.division} />
                    <span className='text-muted-foreground text-sm'>
                      ({stat.total_contracts} contract
                      {stat.total_contracts !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className='text-right text-sm'>
                    <div className='font-medium'>
                      Avg: {formatPercentage(stat.avg_revenue_share)}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {formatPercentage(stat.min_revenue_share)} -{' '}
                      {formatPercentage(stat.max_revenue_share)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
