import { cn, getRarityClassNames } from "@/utils/helpers";

export default function PlayerStats({
  player,
  stats,
  isTrainingMode,
  minusStatValue,
  plusStatValue,
  resetStatValue,
}) {
  return (
    <div className="mt-8 flow-root">
      <div className="-my-3 overflow-x-auto">
        <div className="inline-block min-w-full py-2 align-middle">
          <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
            <thead>
              <tr>
                {Object.entries(stats).map(([key]) => (
                  <th
                    key={key}
                    scope="col"
                    className="first:pl-0 last:pr-0 whitespace-nowrap px-1.5 sm:px-2 py-1 text-sm sm:text-base text-center font-semibold tracking-wide text-slate-700 dark:text-slate-400 uppercase"
                  >
                    {key.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950">
              <tr>
                {Object.entries(stats).map(([key, val]: [string, number]) => {
                  const diff = val - player.metadata[key];
                  return (
                    <td
                      key={`${key}-${val}`}
                      className="first:pl-0 last:pr-0 align-top whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-base sm:text-lg text-center text-slate-500 dark:text-slate-200"
                    >
                      <div
                        className={`${getRarityClassNames(
                          val
                        )} relative inline-flex rounded-lg p-2.5 sm:p-3 font-medium leading-6`}
                      >
                        {val >= 0 ? val : "–"}
                      </div>
                      {isTrainingMode && (
                        <div className="mt-2 grid grid-cols-2 gap-x-1 gap-y-1">
                          <button
                            onClick={() => minusStatValue(key)}
                            className="flex items-center justify-center text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 py-1 rounded-md cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
                          >
                            -
                          </button>
                          <button
                            onClick={() => plusStatValue(key)}
                            className="flex items-center justify-center text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 py-1 rounded-md cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
                          >
                            +
                          </button>
                          <div className="col-span-2">
                            <span
                              className={cn(
                                "text-sm px-2 py-0.5 rounded-md",
                                diff > 0 && "bg-green-600 text-white",
                                diff === 0 && "bg-white text-slate-900",
                                diff < 0 && "bg-red text-slate-900"
                              )}
                            >
                              {diff > 0 && "+"}
                              {diff}
                            </span>
                          </div>
                          {diff !== 0 && (
                            <button
                              onClick={() => resetStatValue(key)}
                              className="text-indigo-500 hover:text-indigo-400 col-span-2 text-xs"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
