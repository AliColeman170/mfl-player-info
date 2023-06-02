import { getRarityClassNames } from "@/utils";

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
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                        <thead>
                            <tr>
                                {Object.entries(stats).map(([key]) => (
                                    <th key={key} scope="col" className="whitespace-nowrap px-2 py-1 text-center font-semibold tracking-wide text-slate-700 dark:text-slate-200 uppercase">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950">
                            <tr>
                                {Object.entries(stats).map(([key, val]) => (
                                    <td key={`${key}-${val}`} className="whitespace-nowrap px-2 py-5 text-lg text-center text-slate-500 dark:text-slate-200"><span className={`${getRarityClassNames(val)} rounded-lg p-3 font-medium`}>{(val > 0) ? val : '–'}</span></td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
