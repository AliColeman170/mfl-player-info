import { getRarityClassNames } from "@/utils";

export default function GoalkeeperStats({ player }) {
    return (
        <div className="mt-8 flow-root">
            <div className="-my-3 overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                        <thead>
                            <tr>
                                <th scope="col" className="first:pl-0 last:pr-0 whitespace-nowrap px-2 py-1 text-sm sm:text-base text-center font-semibold tracking-wide text-slate-700 dark:text-slate-200 uppercase">GK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950">
                            <tr>
                                <td className="first:pl-0 last:pr-0 whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-base sm:text-lg text-center text-slate-500 dark:text-slate-200"><span className={`${getRarityClassNames(player.metadata.goalkeeping)} rounded-lg p-2.5 sm:p-3 font-medium`}>{player.metadata.goalkeeping}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
