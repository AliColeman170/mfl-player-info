import { PlayerCard } from "@/components/Compare/PlayerCard";
import { PlayerComparison } from "@/components/Compare/PlayerComparison";
import { PlayerStatsComparison } from "@/components/Compare/PlayerStatsComparison";
import { ComparePlayerSearch } from "@/components/Search/ComparePlayerSearch";
import SpinnerIcon from "@/components/SpinnerIcon";
import { Suspense } from "react";

export default function ComparePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const player1Id = searchParams.player1 || "";
  const player2Id = searchParams.player2 || "";
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <ComparePlayerSearch
        key={`player1=${player1Id}&player2=${player2Id}`}
        player1={player1Id}
        player2={player2Id}
      />
      <PlayerComparison
        key={`compare/player1=${player1Id}&player2=${player2Id}`}
        player1Id={player1Id}
        player2Id={player2Id}
      />
    </div>
  );
}
