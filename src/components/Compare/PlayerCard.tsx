import ImageCard from "../Player/ImageCard";
import BasicInfo from "../Player/BasicInfo";
import { cn } from "@/utils/helpers";

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
        `@container/main mx-auto w-full max-w-xl transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8`,
        className
      )}
    >
      <div className="space-y-8 @sm:space-y-0 @sm:grid @sm:grid-cols-3 @sm:space-x-8 @sm:items-center">
        <ImageCard playerId={player.id} />
        <BasicInfo player={player} />
      </div>
    </div>
  );
}
