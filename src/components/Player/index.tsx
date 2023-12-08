import BasicInfo from "./BasicInfo";
import ImageCard from "./ImageCard";
import GoalkeeperStats from "./GoalkeeperStats";
import PositionRatings from "./PositionRatings";
import ContractStats from "./ContractStats";
import { Suspense } from "react";
import SpinnerIcon from "../SpinnerIcon";

export default function Player({ player }) {
  const isGoalkeeper = player.metadata.positions.includes("GK");

  return (
    <div className="@container/main mx-auto w-full max-w-xl transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8">
      <div className="space-y-8 @sm/main:space-y-0 @sm/main:grid @sm/main:grid-cols-3 @sm/main:space-x-8 @sm/main:items-center">
        <ImageCard playerId={player.id} />
        <BasicInfo player={player} />
      </div>
      {isGoalkeeper && <GoalkeeperStats player={player} />}
      {!isGoalkeeper && <PositionRatings player={player} />}
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <SpinnerIcon className="animate-spin h-8 w-8 text-slate-400" />
          </div>
        }
      >
        <ContractStats player={player} />
      </Suspense>
    </div>
  );
}
