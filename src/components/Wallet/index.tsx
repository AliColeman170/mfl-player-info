'use client';

import { ConnectButton } from './ConnectButton';
import { UserProfile } from './UserProfile';
import { useUser } from './UserProvider';
import { use } from 'react';

export function Wallet() {
  const { userPromise } = useUser();
  const user = use(userPromise);

  if (!user) return <ConnectButton />;

  return <UserProfile user={user} />;
}
