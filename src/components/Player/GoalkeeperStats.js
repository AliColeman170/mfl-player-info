import { getRarityClassNames } from "@/utils";

export default function GoalkeeperStats({ player }) {
    return (
        <div className="mt-8 flow-root">
            <div className="-my-3 overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                        <thead>
                            <tr>
                                <th scope="col" className="whitespace-nowrap px-2 py-1 text-center font-semibold tracking-wide text-slate-900 dark:text-slate-200 uppercase">GK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950">
                            <tr>
                                <td className="whitespace-nowrap px-2 py-5 text-lg text-center text-slate-500 dark:text-slate-200"><span className={`${getRarityClassNames(player.metadata.goalkeeping)} rounded-lg p-3 font-medium`}>{player.metadata.goalkeeping}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
