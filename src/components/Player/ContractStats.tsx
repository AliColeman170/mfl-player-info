import { getContactDataByPlayer } from '@/data/players';
import { Player } from '@/types/global.types';
import { InformationCircleIcon } from '@heroicons/react/24/solid';

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

export async function ContractStats({ player }: { player: Player }) {
  const contractData: Player[] = await getContactDataByPlayer(player);

  if (!contractData[0]) return null;

  const zeroFilteredContractData = contractData.filter(
    (c) => c.activeContract!.revenueShare !== 0
  );

  const groupedByDivision = zeroFilteredContractData.reduce((map, contract) => {
    const division = contract.activeContract!.club.division;
    if (!map.has(division)) {
      map.set(division, []);
    }
    map.get(division).push(contract);
    return map;
  }, new Map());

  const groupedByDivisionSorted = new Map(
    [...groupedByDivision.entries()].sort()
  );

  let contractInfo: Array<{
    division: number;
    total: number;
    minRevenueShare: number;
    maxRevenueShare: number;
    averageRevenueShare: number;
  }> = [];

  groupedByDivisionSorted.forEach((contracts, division) => {
    const sortedByRevenueShare = contracts.sort(
      (a: Player, b: Player) =>
        a.activeContract!.revenueShare - b.activeContract!.revenueShare
    );

    const minRevenueShare = sortedByRevenueShare[0].activeContract.revenueShare;
    const maxRevenueShare =
      sortedByRevenueShare[sortedByRevenueShare.length - 1].activeContract
        .revenueShare;
    const averageRevenueShare =
      contracts.reduce(
        (sum: number, contract: Player) =>
          sum + contract.activeContract!.revenueShare,
        0
      ) / contracts.length;

    contractInfo.push({
      division,
      total: contracts.length,
      minRevenueShare,
      maxRevenueShare,
      averageRevenueShare,
    });
  });

  return (
    <div className='mt-12'>
      <h2 className='flex items-center space-x-2 text-2xl font-bold tracking-tight sm:text-3xl'>
        <span>Contract Info</span>
        <div className='group relative flex justify-center'>
          <InformationCircleIcon className='text-muted-foreground size-6' />
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
        {contractInfo.map(
          ({
            division,
            total,
            minRevenueShare,
            maxRevenueShare,
            averageRevenueShare,
          }) => (
            <div className='grid grid-cols-[1fr_4rem_4rem_4rem]' key={division}>
              <div className='w-full px-1.5 py-4 text-left font-medium whitespace-nowrap sm:px-2 sm:pl-1'>
                <div className='flex items-center space-x-1'>
                  <Division division={division} />
                  <span title='Total Players'>({total})</span>
                </div>
              </div>
              <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                {formatPercentage(minRevenueShare)}
              </div>
              <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                {formatPercentage(averageRevenueShare)}
              </div>
              <div className='px-1.5 py-4 text-center font-medium whitespace-nowrap sm:px-2'>
                {formatPercentage(maxRevenueShare)}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
