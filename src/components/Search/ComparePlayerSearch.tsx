"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SearchComboBox } from "./SearchCombobox";

export function ComparePlayerSearch({ player1, player2 }) {
  const router = useRouter();
  const [player1Loading, loadPlayer1] = useTransition();
  const [player2Loading, loadPlayer2] = useTransition();

  function handlePlayer1Change(id) {
    loadPlayer1(() => {
      router.push(`/compare?player1=${id}&player2=${player2}`);
    });
  }
  function handlePlayer2Change(id) {
    loadPlayer2(() => {
      router.push(`/compare?player1=${player1}&player2=${id}`);
    });
  }

  return (
    <div className="w-full max-w-5xl grid grid-cols-2 gap-x-4 md:gap-x-8 place-items-center">
      <div className="max-w-xl w-full">
        <div className="relative">
          <SearchComboBox
            key="player-1"
            id={player1}
            handlePlayerChange={handlePlayer1Change}
            isLoading={player1Loading}
          />
        </div>
      </div>
      <div className="max-w-xl w-full">
        <div className="relative">
          <SearchComboBox
            key="player-2"
            id={player2}
            handlePlayerChange={handlePlayer2Change}
            isLoading={player2Loading}
          />
        </div>
      </div>
    </div>
  );
}
