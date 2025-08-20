import { useTransition } from 'react';
import { logout } from '@/actions/auth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import {
  HeartIcon,
  Loader2Icon,
  LogOutIcon,
  UserCircleIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthUserProfile } from '@/data/auth';

export function UserProfile({ user }: { user: NonNullable<AuthUserProfile> }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger className='focus:ring-primary focus:ring-offset-background relative flex rounded-full text-sm focus:ring-2 focus:ring-offset-2 focus:outline-hidden'>
        <span className='sr-only'>Open user menu</span>
        {user?.profile?.avatar ? (
          <Image
            className='size-10 rounded-full'
            src={user.profile.avatar}
            alt={
              user.profile.name
                ? user.profile.name
                : user.profile.discordUser?.username
                  ? user.profile.discordUser?.username
                  : user.profile.walletAddress
            }
            width={745}
            height={745}
            unoptimized
          />
        ) : (
          <UserCircleIcon className='h-12 w-12 rounded-full text-slate-300' />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48' align='end'>
        <DropdownMenuItem asChild>
          <Link href='/players-table?favourites=favourites'>
            <HeartIcon />
            <span>Favourites</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/players-table?walletAddress=${user.app_metadata.address}`}
          >
            <UsersIcon />
            <span>My Players</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
          {isPending ? (
            <Loader2Icon className='animate-spin' />
          ) : (
            <LogOutIcon />
          )}
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
