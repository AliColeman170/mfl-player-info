"use client";

import { fcl } from "@/flow/api";
import { createContext, useContext, useEffect, useState } from "react";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({ loggedIn: null, addr: "" });
  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error("useUser has to be used within <UserContext.Provider>");
  }
  return userContext;
};
