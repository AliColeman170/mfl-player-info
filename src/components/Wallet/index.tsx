'use client';

import { ConnectButton } from './ConnectButton';
import { UserProfile } from './UserProfile';
import { useUser } from './UserProvider';
import { use } from 'react';

export function Wallet() {
  const { userPromise } = useUser();
  const userData = use(userPromise);

  if (!userData) return <ConnectButton />;

  return <UserProfile userData={userData} />;
}
