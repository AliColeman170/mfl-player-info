import { createClient } from '@/lib/supabase/server';
import { Player } from '@/types/global.types';
import { InfoIcon } from 'lucide-react';

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

export async function ContractStatsRPC({ player }: { player: Player }) {
  const supabase = createClient();

  try {
    const { data: contractStats, error } = await supabase.rpc(
      'get_contract_stats_for_player',
      {
        player_id: player.id,
      }
    );

    if (error) {
      console.error('Error fetching contract stats:', error);
      return null;
    }

    if (!contractStats || contractStats.length === 0) {
      return null;
    }

    const typedContractStats = contractStats as ContractStatsRow[];

    return (
      <div className='mt-12'>
        <h2 className='flex items-center space-x-2 text-2xl font-bold tracking-tight sm:text-3xl'>
          <span>Contract Info</span>
          <div className='group relative flex justify-center'>
            <InfoIcon className='text-muted-foreground size-6' />
            <span className='bg-background text-foreground shadow-foreground/2 absolute bottom-8 w-48 scale-0 rounded-lg p-2 text-center text-xs normal-case shadow-xl transition-all group-hover:scale-100'>
              Based on revenue share on active contracts for players of similar
              age, rating and position.
            </span>
          </div>
        </h2>
        <div className='divide-border mt-4 grid divide-y'>
          <div className='grid grid-cols-[1fr_4rem_4rem_4rem]'>
            <div></div>
            <div className='text-muted-foreground px-1.5 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase sm:px-2 sm:text-base'>
              Min
            </div>
            <div className='text-muted-foreground px-1.5 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase sm:px-2 sm:text-base'>
              Avg
            </div>
            <div className='text-muted-foreground px-1.5 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase sm:px-2 sm:text-base'>
              Max
            </div>
          </div>
          {typedContractStats.map(
            ({
              division,
              total_contracts,
              min_revenue_share,
              max_revenue_share,
              avg_revenue_share,
            }) => (
              <div className='grid grid-cols-[1fr_4rem_4rem_4rem]' key={division}>
                <div className='w-full px-1.5 py-4 text-left font-medium whitespace-nowrap sm:px-2 sm:pl-1'>
                  <div className='flex items-center space-x-1'>
                    <Division division={division} />
                    <span title='Total Players'>({total_contracts})</span>
                  </div>
                </div>
                <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                  {formatPercentage(min_revenue_share)}
                </div>
                <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                  {formatPercentage(Number(avg_revenue_share))}
                </div>
                <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                  {formatPercentage(max_revenue_share)}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ContractStatsRPC:', error);
    return null;
  }
}