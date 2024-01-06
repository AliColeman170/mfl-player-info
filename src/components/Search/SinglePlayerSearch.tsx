"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SearchInput } from "./SearchInput";
import { useDebounce } from "usehooks-ts";

export function SinglePlayerSearch({ id }: { id?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [playerId, setPlayerId] = useState<string | null>(id);
  const debouncedPlayerId = useDebounce<string>(playerId, 800);

  function searchPlayer(id) {
    if (id) {
      startTransition(() => {
        router.push(`/player/${id}`);
      });
    } else {
      router.push(`/`);
    }
  }

  useEffect(() => {
    searchPlayer(debouncedPlayerId);
  }, [debouncedPlayerId]);

  function handleSearchChange(e) {
    if (e.target.value) {
      setPlayerId(e.target.value);
    } else {
      setPlayerId(null);
    }
  }

  return (
    <div className="max-w-xl mx-auto w-full">
      <SearchInput
        value={id ?? ""}
        handleSearch={handleSearchChange}
        isLoading={isPending}
        autoFocus
      />
    </div>
  );
}
