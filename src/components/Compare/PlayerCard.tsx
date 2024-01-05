import ImageCard from "../Player/ImageCard";
import BasicInfo from "../Player/BasicInfo";
import { cn } from "@/utils/helpers";
import { Suspense } from "react";
import SpinnerIcon from "../SpinnerIcon";
import { CareerStats } from "../Player/CareerStats";

export async function PlayerCard({
  player,
  className,
}: {
  player: any;
  className?: string;
}) {
  if (!player) return null;
  return (
    <div
      className={cn(
        `@container/main mx-auto w-full max-w-xl transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8 self-stretch`,
        className
      )}
    >
      <div className="grid grid-cols-1 grid-flow-row gap-y-8 @sm:gap-y-4 @sm:grid @sm:grid-cols-3 @sm:gap-x-8 @sm:items-center">
        <ImageCard playerId={player.id} />
        <BasicInfo player={player} />
        <Suspense
          fallback={
            <div className="flex justify-center col-span-3 py-2">
              <SpinnerIcon className="animate-spin h-6 w-6 text-slate-400" />
            </div>
          }
        >
          <CareerStats player={player} />
        </Suspense>
      </div>
    </div>
  );
}
