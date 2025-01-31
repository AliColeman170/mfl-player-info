'use client';

import { fcl } from '@/flow/api';
import { useTransition } from 'react';
import { WalletIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { usePathname } from 'next/navigation';
import { login } from '@/actions/auth';
import { toast } from 'sonner';

export default function ConnectButton({ showText = false }) {
  let [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  async function handleLogin() {
    startTransition(async () => {
      const credentials = await fcl.authenticate();
      fcl.unauthenticate();
      const result = await login(credentials, pathname);
      if (!result.success) {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      onClick={handleLogin}
      type='button'
      className='flex items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-4 sm:py-3 sm:text-base'
    >
      {isPending ? (
        <SpinnerIcon className='h-5 w-5 animate-spin' />
      ) : (
        <WalletIcon className='h-5 w-5' />
      )}
      {showText && <span className='ml-2'>Connect Wallet</span>}
    </button>
  );
}
