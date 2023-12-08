"use client";

import { HeartIcon as FilledHeartIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import SpinnerIcon from "../SpinnerIcon";
import { useTransition } from "react";
import { cn } from "@/utils/helpers";
import { deleteFavourite, setFavourite } from "@/lib/actions";

export function ToggleFavouriteButton({
  user,
  playerId,
  isFavourite,
  className,
}: {
  user: {
    addr?: string;
  };
  playerId: string | number;
  isFavourite: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  async function toggleFavourite() {
    startTransition(() => {
      isFavourite
        ? deleteFavourite(playerId)
        : setFavourite(playerId, !isFavourite);
    });
  }

  return (
    <button
      disabled={!user}
      className={cn("flex", className)}
      onClick={toggleFavourite}
    >
      {isPending ? (
        <SpinnerIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 animate-spin" />
      ) : isFavourite ? (
        <FilledHeartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 disabled:text-slate-500" />
      ) : (
        <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 hover:text-red-500" />
      )}
    </button>
  );
}
