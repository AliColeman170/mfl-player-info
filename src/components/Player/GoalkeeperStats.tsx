import { Player } from '@/types/global.types';
import { getRarityClassNames } from '@/utils/helpers';

export function GoalkeeperStats({ player }: { player: Player }) {
  return (
    <div className='mt-8 flow-root'>
      <div className='-my-3 overflow-x-auto'>
        <div className='inline-block min-w-full py-2 align-middle'>
          <table className='min-w-full divide-y divide-slate-300 dark:divide-slate-700'>
            <thead>
              <tr>
                <th
                  scope='col'
                  className='whitespace-nowrap px-2 py-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 first:pl-0 last:pr-0 sm:text-base dark:text-slate-200'
                >
                  GK
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-950'>
              <tr>
                <td className='whitespace-nowrap px-1.5 py-4 text-center text-base text-slate-500 first:pl-0 last:pr-0 sm:px-2 sm:py-5 sm:text-lg dark:text-slate-200'>
                  <span
                    className={`${getRarityClassNames(
                      player.metadata.goalkeeping
                    )} rounded-lg p-2.5 font-medium sm:p-3`}
                  >
                    {player.metadata.goalkeeping}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
