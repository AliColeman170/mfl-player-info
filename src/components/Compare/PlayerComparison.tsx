import { getPlayerData } from "@/flow/api";
import { PlayerCard } from "./PlayerCard";
import NotFound from "../Player/NotFound";
import { PlayerStatsComparison } from "./PlayerStatsComparison";
import PositionRatingsComparison from "./PositionRatingsComparison";

export async function PlayerComparison({ player1Id, player2Id }) {
  const player1 = await getPlayerData(player1Id);
  const player2 = await getPlayerData(player2Id);
  return (
    <div className="w-full max-w-5xl grid grid-cols-2 gap-4 md:gap-8 place-items-center">
      {player1Id && (player1 ? <PlayerCard player={player1} /> : <NotFound />)}
      {player2Id && (player2 ? <PlayerCard player={player2} /> : <NotFound />)}
      {player1 && player2 && (
        <>
          <PlayerStatsComparison player1={player1} player2={player2} />
          <PositionRatingsComparison player1={player1} player2={player2} />
        </>
      )}
    </div>
  );
}
