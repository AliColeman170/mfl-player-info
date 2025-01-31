'use client';

import { cn } from '@/utils/helpers';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { useTransition } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { logout } from '@/actions/auth';

export function LogoutButton() {
  let [isPending, startTransition] = useTransition();

  async function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <button
      onClick={handleLogout}
      aria-disabled={isPending}
      className={cn(
        'flex w-full items-center space-x-2 px-4 py-3 text-base text-slate-700 hover:bg-slate-100 dark:text-slate-100 hover:dark:bg-slate-900'
      )}
    >
      {isPending ? (
        <SpinnerIcon className='h-5 w-5 animate-spin' />
      ) : (
        <ArrowRightStartOnRectangleIcon className='h-5 w-5 text-slate-900 dark:text-white' />
      )}
      <span>Sign Out</span>
    </button>
  );
}
