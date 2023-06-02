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
                    <div key={key} className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt className="font-semibold leading-6 text-slate-700 dark:text-slate-400 uppercase">{key}</dt>
                        <dd className="mt-1 leading-6 text-slate-700 dark:text-slate-200 sm:col-span-2 sm:mt-0 capitalize">{value}</dd>
                    </div>
                    )
                )}
            </dl>
        </div>
    )
}
