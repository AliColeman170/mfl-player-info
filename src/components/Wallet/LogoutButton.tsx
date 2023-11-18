"use client";
import { fcl } from "@/flow/api";
import { logout } from "@/lib/actions";
import { cn } from "@/utils/helpers";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import React, { useTransition } from "react";

export default function LogoutButton() {
  let [isPending, startTransition] = useTransition();

  async function handleLogout() {
    fcl.unauthenticate();
    startTransition(() => {
      logout();
    });
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "w-full px-4 py-3 text-base text-slate-700 dark:text-slate-100 flex items-center space-x-2 hover:bg-slate-100 hover:dark:bg-slate-900"
      )}
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-900 dark:text-white" />
      <span>Sign Out</span>
    </button>
  );
}
