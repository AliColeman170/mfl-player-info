import { getRarityClassNames } from "@/utils/helpers";

export default function PlayerStats({ player }) {
    const { pace, dribbling, passing, shooting, defense, physical } = player.metadata;
    const stats = {
        pac: pace,
        dri: dribbling,
        pas: passing,
        sho: shooting,
        def: defense,
        phy: physical
    };
    
    return (
        <div className="mt-8 flow-root">
            <div className="-my-3 overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle">
                    <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                        <thead>
                            <tr>
                                {Object.entries(stats).map(([key]) => (
                                    <th key={key} scope="col" className="first:pl-0 last:pr-0 whitespace-nowrap px-1.5 sm:px-2 py-1 text-sm sm:text-base text-center font-semibold tracking-wide text-slate-700 dark:text-slate-200 uppercase">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950">
                            <tr>
                                {Object.entries(stats).map(([key, val]) => (
                                    <td key={`${key}-${val}`} className="first:pl-0 last:pr-0 whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-base sm:text-lg text-center text-slate-500 dark:text-slate-200"><span className={`${getRarityClassNames(val)} rounded-lg p-2.5 sm:p-3 font-medium`}>{(val > 0) ? val : '–'}</span></td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
