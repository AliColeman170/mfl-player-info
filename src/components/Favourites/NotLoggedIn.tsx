import { ConnectButton } from '../Wallet/ConnectButton';
import { HeartIcon } from '@heroicons/react/24/solid';

export async function NotLoggedIn() {
  return (
    <div className='m-24 flex flex-1 flex-col justify-center text-center'>
      <HeartIcon className='mx-auto size-12 text-red-500' />
      <h3 className='mt-2 text-3xl font-semibold'>No Favourites</h3>
      <p className='text-muted mt-1 text-base'>
        Connect your wallet to view or create favourites.
      </p>
      <div className='mt-6 flex justify-center'>
        <ConnectButton showText={true} />
      </div>
    </div>
  );
}
