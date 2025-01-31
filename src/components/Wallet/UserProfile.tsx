import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
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
import { LogoutButton } from './LogoutButton';
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
  return (
    <Menu as='div' className='relative'>
      <div>
        <MenuButton className='relative flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-slate-800 dark:focus:ring-offset-slate-950'>
          <span className='sr-only'>Open user menu</span>
          {userProfile?.avatar ? (
            <Image
              className='h-12 w-12 rounded-full'
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
        <MenuItems className='absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-slate-50 py-1 shadow-2xl shadow-slate-300 ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:shadow-slate-900 dark:ring-slate-800'>
          <MenuItem>
            <Link
              href='/favourites'
              className={cn(
                'flex items-center space-x-2 px-4 py-2 text-base text-slate-700 data-[focus]:bg-slate-100 dark:text-slate-100 dark:data-[focus]:bg-slate-900'
              )}
            >
              <HeartIcon className='h-5 w-5 text-slate-900 dark:text-white' />
              <span>Favourites</span>
            </Link>
          </MenuItem>
          <MenuItem>
            <Link
              href={`/user/${user.user_metadata.address}`}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 text-base text-slate-700 data-[focus]:bg-slate-100 dark:text-slate-100 dark:data-[focus]:bg-slate-900'
              )}
            >
              <UserGroupIcon className='h-5 w-5 text-slate-900 dark:text-white' />
              <span>My Players</span>
            </Link>
          </MenuItem>
          <MenuItem>
            <LogoutButton />
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
