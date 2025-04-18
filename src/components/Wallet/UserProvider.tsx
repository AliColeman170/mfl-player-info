'use client';

import { AuthUserProfile } from '@/data/auth';
import { createContext, useContext } from 'react';

type UserContextType = {
  userPromise: Promise<AuthUserProfile | null>;
};

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<AuthUserProfile | null>;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider
      value={{
        userPromise,
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
