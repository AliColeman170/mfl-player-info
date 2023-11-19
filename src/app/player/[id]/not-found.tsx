import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl py-8 flex flex-col items-center">
      <h2 className="text-3xl tracking-tight font-bold text-slate-900 dark:text-slate-200 flex justify-center">
        <ExclamationCircleIcon className="w-16 h-16" />
      </h2>
      <p className="mt-4 text-slate-900 dark:text-slate-200">Player with the requested ID could not be found.</p>
    </div>
  );
}