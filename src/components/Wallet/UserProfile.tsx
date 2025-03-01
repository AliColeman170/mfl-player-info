'use client';

import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid';
import { useTransition } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { logout } from '@/actions/auth';
import { toast } from 'sonner';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  MenuSeparator,
  Transition,
} from '@headlessui/react';
import {
  HeartIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { Fragment } from 'react';
import { cn } from '@/utils/helpers';
import Image from 'next/image';
import { MFLUser } from '@/types/global.types';
import { User } from '@supabase/supabase-js';

export function UserProfile({
  user,
  userProfile,
}: {
  user: User;
  userProfile: MFLUser | null;
}) {
  let [isPending, startTransition] = useTransition();

  async function handleLogout() {
    startTransition(async () => {
      const result = await logout();
      if (!result.success) {
        toast.error(result.message);
      }
    });
  }
  return (
    <Menu as='div' className='relative'>
      <div>
        <MenuButton className='focus:ring-primary focus:ring-offset-background relative flex rounded-full text-sm focus:ring-2 focus:ring-offset-2 focus:outline-hidden'>
          <span className='sr-only'>Open user menu</span>
          {userProfile?.avatar ? (
            <Image
              className='size-10 rounded-full'
              src={userProfile.avatar}
              alt={
                userProfile.name
                  ? userProfile.name
                  : userProfile.discordUser?.username
                    ? userProfile.discordUser?.username
                    : userProfile.walletAddress
              }
              width={745}
              height={745}
              unoptimized
            />
          ) : (
            <UserCircleIcon className='h-12 w-12 rounded-full text-slate-300' />
          )}
        </MenuButton>
      </div>
      <Transition
        as={Fragment}
        enter='transition ease-out duration-100'
        enterFrom='transform opacity-0 scale-95'
        enterTo='transform opacity-100 scale-100'
        leave='transition ease-in duration-75'
        leaveFrom='transform opacity-100 scale-100'
        leaveTo='transform opacity-0 scale-95'
      >
        <MenuItems className='bg-popover focus:outline-primary ring-ring shadow-secondary-foreground/5 absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md py-1 shadow-2xl ring-1 focus:outline-2 focus:outline-offset-4'>
          <MenuItem>
            <Link
              href='/favourites'
              className={cn(
                'group data-focus:bg-accent text-accent-foreground flex items-center gap-x-3 px-3 py-2 text-sm'
              )}
            >
              <HeartIcon className='group-data-focus:text-primary size-5' />
              <span>Favourites</span>
            </Link>
          </MenuItem>
          <MenuItem>
            <Link
              href={`/user/${user.user_metadata.address}`}
              className={cn(
                'group data-focus:bg-accent text-accent-foreground flex items-center gap-x-3 px-3 py-2 text-sm'
              )}
            >
              <UserGroupIcon className='group-data-focus:text-primary size-5' />
              <span>My Players</span>
            </Link>
          </MenuItem>
          <MenuSeparator className='border-border my-1 border-t' />
          <MenuItem>
            <button
              onClick={handleLogout}
              aria-disabled={isPending}
              className={cn(
                'group data-focus:bg-accent text-accent-foreground flex w-full cursor-pointer items-center gap-x-3 px-3 py-2 text-sm'
              )}
            >
              {isPending ? (
                <SpinnerIcon className='size-5 animate-spin' />
              ) : (
                <ArrowRightStartOnRectangleIcon className='group-data-focus:text-primary size-5' />
              )}
              <span>Sign Out</span>
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
