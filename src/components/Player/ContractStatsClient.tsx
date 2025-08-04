'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Player } from '@/types/global.types';
import { InfoIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '../UI/button-alt';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/UI/collapsible';

interface ContractStatsRow {
  division: number;
  total_contracts: number;
  min_revenue_share: number;
  max_revenue_share: number;
  avg_revenue_share: number;
}

function Division({ division }: { division: number }) {
  const divisionClasses: { [key: number]: string } = {
    1: 'bg-[#3be9f8]',
    2: 'bg-[#13d389]',
    3: 'bg-[#ffd23e]',
    4: 'bg-[#f3f3f3]',
    5: 'bg-[#fd7a00]',
    6: 'bg-[#865e3f]',
    7: 'bg-[#71717a]',
    8: 'bg-[#82a1b7]',
    9: 'bg-[#ffd939]',
    10: 'bg-[#757061]',
  };

  const divisionNames: { [key: number]: string } = {
    1: 'Diamond',
    2: 'Platinum',
    3: 'Gold',
    4: 'Silver',
    5: 'Bronze',
    6: 'Iron',
    7: 'Stone',
    8: 'Ice',
    9: 'Spark',
    10: 'Flint',
  };

  return (
    <span className='flex items-center space-x-2'>
      <span
        className={`h-4 w-4 rounded-full ${divisionClasses[division]}`}
      ></span>
      <span>{divisionNames[division]}</span>
    </span>
  );
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat('default', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100 / 100);
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

export function ContractStatsClient({ player }: { player: Player }) {
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
        <div className='bg-card border-border flex items-center justify-between rounded-md border py-2 pr-2 pl-3'>
          <div className='flex items-center gap-2'>
            <h2 className='ml-1 text-base font-semibold'>Contract Info</h2>
            <div className='group relative flex justify-center'>
              <InfoIcon className='text-muted-foreground size-4' />
              <span className='bg-background text-foreground shadow-foreground/2 absolute bottom-6 w-48 scale-0 rounded-lg p-2 text-center text-xs normal-case shadow-xl transition-all group-hover:scale-100'>
                Based on revenue share on active contracts for players of
                similar age, rating and position.
              </span>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='sm' className='p-1'>
              <ChevronsUpDownIcon />
              <span className='sr-only'>Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className='divide-border mt-2 grid divide-y'>
            <div className='grid grid-cols-[1fr_4rem_4rem_4rem] py-1.5 pl-4'>
              <div className='text-foreground/80 text-left text-sm'>
                Division
              </div>
              <div className='text-foreground/80 text-center text-sm'>Min</div>
              <div className='text-foreground/80 text-center text-sm'>Avg</div>
              <div className='text-foreground/80 text-center text-sm'>Max</div>
            </div>
            {contractStats.map(
              ({
                division,
                total_contracts,
                min_revenue_share,
                max_revenue_share,
                avg_revenue_share,
              }) => (
                <div
                  className='grid grid-cols-[1fr_4rem_4rem_4rem] pl-4 text-sm'
                  key={division}
                >
                  <div className='w-full py-2 text-left font-medium whitespace-nowrap'>
                    <div className='flex items-center gap-x-1'>
                      <Division division={division} />
                      <span title='Total Players'>({total_contracts})</span>
                    </div>
                  </div>
                  <div className='py-2 text-center font-medium whitespace-nowrap'>
                    {formatPercentage(min_revenue_share)}
                  </div>
                  <div className='py-2 text-center font-medium whitespace-nowrap'>
                    {formatPercentage(Number(avg_revenue_share))}
                  </div>
                  <div className='py-2 text-center font-medium whitespace-nowrap'>
                    {formatPercentage(max_revenue_share)}
                  </div>
                </div>
              )
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
