"use client";
import { useRouter } from "next/navigation";
import { SearchInput } from "./SearchInput";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "usehooks-ts";

export function ComparePlayerSearch({ player1, player2 }) {
  const router = useRouter();
  const [player1Loading, loadPlayer1] = useTransition();
  const [player2Loading, loadPlayer2] = useTransition();

  const [player1Id, setPlayer1Id] = useState<string | null>(player1);
  const [player2Id, setPlayer2Id] = useState<string | null>(player2);

  const debouncedPlayer1Id = useDebounce<string>(player1Id, 800);
  const debouncedPlayer2Id = useDebounce<string>(player2Id, 800);

  useEffect(() => {
    loadPlayer1(() => {
      router.push(
        `/compare?player1=${debouncedPlayer1Id}&player2=${player2Id}`
      );
    });
  }, [debouncedPlayer1Id]);

  useEffect(() => {
    loadPlayer2(() => {
      router.push(
        `/compare?player1=${player1Id}&player2=${debouncedPlayer2Id}`
      );
    });
  }, [debouncedPlayer2Id]);

  return (
    <div className="w-full max-w-5xl grid grid-cols-2 gap-x-4 md:gap-x-8 place-items-center">
      <div className="max-w-xl w-full">
        <SearchInput
          placeholder="Player 1 ID"
          value={player1 ?? ""}
          handleSearch={(e) => setPlayer1Id(e.target.value)}
          isLoading={player1Loading}
        />
      </div>
      <div className="max-w-xl w-full">
        <SearchInput
          placeholder="Player 2 ID"
          value={player2 ?? ""}
          handleSearch={(e) => setPlayer2Id(e.target.value)}
          isLoading={player2Loading}
        />
      </div>
    </div>
  );
}
