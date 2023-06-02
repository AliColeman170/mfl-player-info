"use client"
import { useParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function Search() {
    const router = useRouter();
    const params = useParams();
    const [isPending, startTransition] = useTransition()

    function searchPlayer(e) {
        if (e.target.value) {
            startTransition(() => {
                router.push(`/player/${e.target.value}`)
            });
        } else {
            router.push(`/`)
        }
    }
    return (
        <div className="mx-auto w-full max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-black dark:ring-slate-800 ring-opacity-5">
            <div className="relative">
                <svg className="pointer-events-none absolute left-4 top-4 h-8 w-8 text-gray-400 dark:text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input
                    type="number"
                    step={1}
                    min={1}
                    className="h-16 text-xl w-full border-0 bg-transparent pl-16 pr-4 text-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Player ID..."
                    defaultValue={params.id ?? ''}
                    onChange={searchPlayer}
                    role="combobox"
                    aria-expanded="false"
                    aria-controls="options"
                />
                {isPending && <svg className="animate-spin absolute right-5 top-5 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>}
            </div>
        </div>
    )
}
