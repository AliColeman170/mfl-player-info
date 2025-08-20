'use client';

import { fcl } from '@/flow/api';
import { useTransition } from 'react';
import { WalletIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { usePathname } from 'next/navigation';
import { login } from '@/actions/auth';
import { toast } from 'sonner';
import { Button } from '../UI/button';

export function ConnectButton({ showText = false }) {
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
    <Button onClick={handleLogin} type='button'>
      {isPending ? <SpinnerIcon className='animate-spin' /> : <WalletIcon />}
      {showText && <span className='ml-2'>Connect Wallet</span>}
    </Button>
  );
}
