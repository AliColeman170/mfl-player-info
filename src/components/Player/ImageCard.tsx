import Image from "next/image";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/20/solid";
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
    <div className="@container/image w-full mx-auto max-w-xs @sm:mx-0">
      <Image
        className="-mt-2 max-w-[200px] w-full mx-auto @sm:max-w-none px-2"
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
          href={{
            pathname: "/compare",
            query: {
              player1: playerId,
              player2: "",
            },
          }}
          className="flex items-center justify-center space-x-1.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 px-2.5 py-2 sm:px-3 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
        >
          <ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
        <Link
          href={`https://app.playmfl.com/players/${playerId}`}
          target="_blank"
          className="hidden @[124px]/image:flex items-center justify-center space-x-1.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 px-2.5 py-2 sm:px-3 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5" />
        </Link>
      </div>
    </div>
  );
}
