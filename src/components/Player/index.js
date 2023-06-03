import BasicInfo from "./BasicInfo";
import ImageCard from "./ImageCard";
import PlayerStats from "./PlayerStats";
import GoalkeeperStats from "./GoalkeeperStats";
import PositionRatings from "./PositionRatings";

export default function Player({ player }) {
    const isGoalkeeper = player.metadata.positions.includes('GK');
    
    return (
        <div className="mx-auto w-full max-w-xl transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-black dark:ring-slate-800 ring-opacity-5 p-6 sm:p-8">
            <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 sm:space-x-8 sm:items-center">
                <ImageCard playerId={player.id} />
                <BasicInfo player={player} />
            </div>
            {isGoalkeeper ? <GoalkeeperStats player={player} /> : <PlayerStats player={player} />}
            {!isGoalkeeper && <PositionRatings player={player} />}
        </div>
    )
}
