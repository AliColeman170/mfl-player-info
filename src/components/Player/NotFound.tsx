import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function NotFound() {
  return (
    <div className='mx-auto flex w-full max-w-xl flex-col items-center py-8'>
      <h2 className='flex justify-center text-3xl font-bold tracking-tight'>
        <ExclamationCircleIcon className='size-16' />
      </h2>
      <p className='mt-4'>Player with the requested ID could not be found.</p>
    </div>
  );
}
