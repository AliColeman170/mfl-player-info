import { SpinnerIcon } from '@/components/SpinnerIcon';

export default function FavouritesLoading() {
  return (
    <div className='flex h-64 items-center justify-center'>
      <SpinnerIcon className='h-8 w-8 animate-spin' />
    </div>
  );
}
