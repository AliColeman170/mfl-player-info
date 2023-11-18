import Link from "next/link";
import MFLIcon from "../MFLIcon";
import Wallet from "../Wallet";

export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 mb-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-7 sm:py-6">
        <div className="flex justify-between sm:grid sm:grid-cols-[50px_1fr_50px]">
          <div className="hidden sm:block"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4">
            <Link href="/">
              <MFLIcon className="w-20 sm:w-24 text-slate-900 dark:text-white" />
            </Link>
            <h1 className="mt-0.5 sm:mt-0 text-slate-900 dark:text-white sm:border-l-2 border-slate-900 dark:border-white text-lg sm:text-2xl font-bold tracking-tight sm:pl-4">
              <Link href="/">Player Info</Link>
            </h1>
          </div>
          <div>
            <Wallet />
          </div>
        </div>
      </div>
    </header>
  );
}
