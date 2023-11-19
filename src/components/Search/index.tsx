"use client"
import { useParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import SpinnerIcon from '../SpinnerIcon';

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
        <div className="mx-auto w-full max-w-xl divide-y divide-slate-100 overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5">
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 sm:top-4 h-7 w-7 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-600" />
                <input
                    type="number"
                    step={1}
                    min={1}
                    className="h-14 sm:h-16 text-lg sm:text-xl w-full border-0 bg-transparent pl-14 sm:pl-16 pr-4 text-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Player ID..."
                    defaultValue={params.id ?? ''}
                    onChange={searchPlayer}
                    autoFocus={true}
                    onFocus={(e) => {
                        var val = e.target.value;
                        e.target.value = '';
                        e.target.value = val;
                    }}
                />
                {isPending && <SpinnerIcon className="animate-spin absolute right-5 top-4 sm:top-5 h-6 w-6 text-slate-400" />}
            </div>
        </div>
    )
}
