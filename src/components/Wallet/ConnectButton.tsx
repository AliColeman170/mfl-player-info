"use client";

import { fcl } from "@/flow/api";
import { useEffect, useTransition } from "react";
import { useUser } from "./UserProvider";
import { authenticate } from "@/lib/actions";
import { WalletIcon } from "@heroicons/react/24/solid";
import SpinnerIcon from "../SpinnerIcon";

export default function ConnectButton({ session, showText = false }) {
  let [isPending, startTransition] = useTransition();
  const { user } = useUser();

  async function login() {
    const credentials = await fcl.authenticate();
    startTransition(async () => {
      authenticate(credentials);
    });
  }

  useEffect(() => {
    if (user.loggedIn) {
      login();
    }
  }, [user]);

  return (
    <button
      onClick={() => login()}
      type="button"
      className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-3 sm:px-4 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {isPending ? (
        <SpinnerIcon className="h-5 w-5 animate-spin" />
      ) : (
        <WalletIcon className="h-5 w-5" />
      )}
      {showText && <span className="ml-2">Connect Wallet</span>}
    </button>
  );
}
