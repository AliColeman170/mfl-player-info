'use client';

import { MFLUser } from '@/types/global.types';
import { User } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

type UserContextType = {
  user: User | null;
  userProfile: MFLUser | null;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  userProfile: null,
});

export function UserProvider({
  serverUser,
  userProfile,
  children,
}: {
  serverUser: User | null;
  userProfile: MFLUser | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider
      value={{
        user: serverUser,
        userProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error('useUser has to be used within <UserContext.Provider>');
  }
  return userContext;
};
