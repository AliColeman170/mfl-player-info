import { Suspense } from "react";
import SpinnerIcon from "../SpinnerIcon";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { MarketValue } from "./MarketValue";

export default async function BasicInfo({ player }) {
    const { name, ageAtMint, height, preferredFoot, positions } = player.metadata;
    const metadata = {
        name,
        age: ageAtMint,
        height: `${height}cm`,
        foot: preferredFoot.toLowerCase(),
        position: positions.join(' / ')
    };
    return (
        <div className="col-span-2">
            <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="px-2 py-2 grid grid-cols-3 sm:gap-4 sm:px-0">
                        <dt className="text-sm sm:text-base font-semibold leading-6 text-slate-700 dark:text-slate-400 uppercase">{key}</dt>
                        <dd className="text-sm sm:text-base leading-6 text-slate-700 dark:text-slate-200 text-right sm:text-left col-span-2 capitalize">{value}</dd>
                    </div>
                    )
                )}
                <div className="px-2 py-2 grid grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm sm:text-base font-semibold leading-6 text-slate-700 dark:text-slate-400 uppercase flex items-center space-x-2">
                        <span>Value</span>
                        <div class="group relative flex justify-center">
                            <button><InformationCircleIcon className="h-5 w-5 text-slate-500" /></button>
                            <span class="absolute w-48 normal-case text-center bottom-8 scale-0 transition-all rounded-lg bg-slate-950 shadow shadow-white/10 p-2 text-xs text-white group-hover:scale-100">
                                Based on current market listings for similar age, rating and position.
                            </span>
                        </div>
                    </dt>
                    <dd className="text-sm sm:text-base leading-6 text-slate-700 dark:text-slate-200 text-right sm:text-left col-span-2 capitalize flex items-center">
                        <Suspense fallback={<SpinnerIcon className="animate-spin h-4 w-4 text-slate-400" />}>
                            <MarketValue player={player} />
                        </Suspense>
                    </dd>
                </div>
            </dl>
        </div>
    )
}
