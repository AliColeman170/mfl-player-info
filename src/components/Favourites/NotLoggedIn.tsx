import { auth } from "@/auth";
import ConnectButton from "../Wallet/ConnectButton";
import { HeartIcon } from "@heroicons/react/24/solid";

export default async function NotLoggedIn() {
  const session = await auth();
  return (
    <div className="text-center flex-1 flex flex-col justify-center m-24">
      <HeartIcon className="h-12 w-12 mx-auto text-red-500" />
      <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        No Favourites
      </h3>
      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
        Connect your wallet to view or create favourites.
      </p>
      <div className="mt-6 flex justify-center">
        <ConnectButton session={session} showText={true} />
      </div>
    </div>
  );
}
