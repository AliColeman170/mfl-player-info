import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function NotFound() {
  return (
    <div className='mx-auto flex w-full max-w-xl flex-col items-center py-8'>
      <h2 className='flex justify-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200'>
        <ExclamationCircleIcon className='h-16 w-16' />
      </h2>
      <p className='mt-4 text-slate-900 dark:text-slate-200'>
        Player with the requested ID could not be found.
      </p>
    </div>
  );
}
