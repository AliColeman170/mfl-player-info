export default function BasicInfo({ player }) {
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
            </dl>
        </div>
    )
}
