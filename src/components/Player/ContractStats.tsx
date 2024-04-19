import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { Player } from '../Table/schema';

async function getContactData(player) {
  const { ageAtMint, positions, overall } = player.metadata;
  const contractData = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=400&ageAtMintMin=${
      parseInt(ageAtMint) - 1
    }&ageAtMintMax=${parseInt(ageAtMint) + 1}&overallMin=${
      parseInt(overall) - 1
    }&overallMax=${parseInt(overall) + 1}&positions=${
      positions[0]
    }&excludingMflOwned=true&isFreeAgent=false`
  ).then((res) => res.json());

  return contractData;
}

function Division({ division }) {
  const divisionClasses = {
    1: 'bg-[#3be9f8]',
    2: 'bg-[#13d389]',
    3: 'bg-[#ffd23e]',
    4: 'bg-[#f3f3f3]',
    5: 'bg-[#fd7a00]',
    6: 'bg-[#865e3f]',
    7: 'bg-[#71717a]',
  };

  const divisionNames = {
    1: 'Diamond',
    2: 'Platinum',
    3: 'Gold',
    4: 'Silver',
    5: 'Bronze',
    6: 'Iron',
    7: 'Stone',
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

function formatPercentage(value) {
  return new Intl.NumberFormat('default', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100 / 100);
}

export default async function ContractStats({ player }) {
  const contractData: Player[] = await getContactData(player);

  const zeroFilteredContractData = contractData.filter(
    (c) => c.activeContract.revenueShare !== 0
  );

  const groupedByDivision = zeroFilteredContractData.reduce((map, contract) => {
    const division = contract.activeContract.club.division;
    if (!map.has(division)) {
      map.set(division, []);
    }
    map.get(division).push(contract);
    return map;
  }, new Map());

  const groupedByDivisionSorted = new Map(
    [...groupedByDivision.entries()].sort()
  );

  let contractInfo = [];

  groupedByDivisionSorted.forEach((contracts, division) => {
    const sortedByRevenueShare = contracts.sort(
      (a, b) => a.activeContract.revenueShare - b.activeContract.revenueShare
    );

    const minRevenueShare = sortedByRevenueShare[0].activeContract.revenueShare;
    const maxRevenueShare =
      sortedByRevenueShare[sortedByRevenueShare.length - 1].activeContract
        .revenueShare;
    const averageRevenueShare =
      contracts.reduce(
        (sum, contract) => sum + contract.activeContract.revenueShare,
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

  if (!contractData[0]) return null;
  return (
    <div className='mt-12'>
      <h2 className='flex items-center space-x-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-200'>
        <span>Contract Info</span>
        <div className='group relative flex justify-center'>
          <button>
            <InformationCircleIcon className='h-6 w-6 text-slate-500' />
          </button>
          <span className='absolute bottom-8 w-48 scale-0 rounded-lg bg-slate-950 p-2 text-center text-xs normal-case text-white shadow shadow-slate-300 transition-all group-hover:scale-100 dark:shadow-slate-900'>
            Based on revenue share on active contracts for players of similar
            age, rating and position.
          </span>
        </div>
      </h2>
      <div className='mt-4 flow-root'>
        <div className='-my-2 overflow-x-auto'>
          <div className='inline-block min-w-full align-middle'>
            <table className='min-w-full divide-y divide-slate-300 dark:divide-slate-700'>
              <thead>
                <tr>
                  <th scope='col'></th>
                  <th
                    scope='col'
                    className='whitespace-nowrap px-1.5 py-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 last:pr-0 sm:px-2 sm:text-base dark:text-slate-200'
                  >
                    Min
                  </th>
                  <th
                    scope='col'
                    className='whitespace-nowrap px-1.5 py-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 last:pr-0 sm:px-2 sm:text-base dark:text-slate-200'
                  >
                    Avg
                  </th>
                  <th
                    scope='col'
                    className='whitespace-nowrap px-1.5 py-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 sm:px-2 sm:text-base dark:text-slate-200'
                  >
                    Max
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                {contractInfo.map(
                  ({
                    division,
                    total,
                    minRevenueShare,
                    maxRevenueShare,
                    averageRevenueShare,
                  }) => (
                    <tr key={division}>
                      <td className='w-full whitespace-nowrap px-1.5 py-4 text-left font-medium text-slate-700 sm:px-2 sm:py-5 sm:pl-1 dark:text-slate-200'>
                        <div className='flex items-center space-x-1'>
                          <Division division={division} />
                          <span title='Total Players'>({total})</span>
                        </div>
                      </td>
                      <td className='whitespace-nowrap px-1.5 py-4 text-center font-medium text-slate-500 sm:px-2 sm:py-5 dark:text-slate-200'>
                        {formatPercentage(minRevenueShare)}
                      </td>
                      <td className='whitespace-nowrap px-1.5 py-4 text-center font-medium text-slate-500 sm:px-2 sm:py-5 dark:text-slate-200'>
                        {formatPercentage(averageRevenueShare)}
                      </td>
                      <td className='whitespace-nowrap px-1.5 py-4 text-center font-medium text-slate-500 sm:px-2 sm:py-5 dark:text-slate-200'>
                        {formatPercentage(maxRevenueShare)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
