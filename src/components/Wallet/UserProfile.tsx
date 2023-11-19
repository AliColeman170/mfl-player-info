"use client";

import { Menu, Transition } from "@headlessui/react";
import {
  HeartIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/utils/helpers";
import LogoutButton from "./LogoutButton";
import Image from "next/image";

export default function UserProfile({ user }) {
  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="relative flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950">
          <span className="sr-only">Open user menu</span>
          {user.dapperData?.image ? (
            <Image
              className="h-12 w-12 rounded-full"
              src={user.dapperData.image}
              alt={
                user.name
                  ? user.name
                  : user.dapperData?.username
                  ? user.dapperData?.username
                  : user.addr
              }
              width={745}
              height={745}
              unoptimized
            />
          ) : (
            <UserCircleIcon className="h-12 w-12 rounded-full text-slate-300" />
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-slate-50 dark:bg-slate-950 shadow-2xl shadow-slate-300 dark:shadow-slate-900 py-1 ring-1 ring-black dark:ring-slate-800 ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/favourites"
                className={cn(
                  active ? "bg-slate-100 dark:bg-slate-900" : "",
                  "px-4 py-2 text-base text-slate-700 dark:text-slate-100 flex items-center space-x-2"
                )}
              >
                <HeartIcon className="h-5 w-5 text-slate-900 dark:text-white" />
                <span>Favourites</span>
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                href={`/user/${user.addr}`}
                className={cn(
                  active ? "bg-slate-100 dark:bg-slate-900" : "",
                  "px-4 py-3 text-base text-slate-700 dark:text-slate-100 flex items-center space-x-2"
                )}
              >
                <UserGroupIcon className="h-5 w-5 text-slate-900 dark:text-white" />
                <span>My Players</span>
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            <>
              <LogoutButton />
            </>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
