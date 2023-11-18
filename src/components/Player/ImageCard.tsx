import Image from "next/image";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { ToggleFavouriteButton } from "../Favourites/ToggleFavouriteButton";
import SpinnerIcon from "../SpinnerIcon";
import { Suspense } from "react";
import { FavouriteButton } from "./FavouriteButton";

function LoadingFavouriteButton() {
  return (
    <div className="flex items-center justify-center space-x-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 px-3 py-2 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 disabled:opacity-50 disabled:pointer-events-none">
      <SpinnerIcon className="h-5 w-5 text-slate-500 animate-spin" />
    </div>
  );
}

export default function ImageCard({ playerId }) {
  return (
    <div className="mx-auto max-w-xs sm:mx-0">
      <Image
        className="-mt-2"
        src={`https://d13e14gtps4iwl.cloudfront.net/players/${playerId}/card_512.png`}
        alt={`Player ${playerId}`}
        width="512"
        height="748"
        unoptimized
        priority
      />
      <div className="mt-4 flex justify-center items-center space-x-1.5">
        <Suspense fallback={<LoadingFavouriteButton />}>
          <FavouriteButton playerId={playerId} />
        </Suspense>
        <Link
          href={`https://app.playmfl.com/players/${playerId}`}
          target="_blank"
          className="flex items-center justify-center space-x-1.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 px-3.5 py-2 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5 -mr-1" />
        </Link>
      </div>
    </div>
  );
}