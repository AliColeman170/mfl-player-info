"use client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { SearchInput } from "./SearchInput";
import { useDebounceValue } from "usehooks-ts";

export function SinglePlayerSearch({ id }: { id?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [debouncedPlayerId, setPlayerId] = useDebounceValue<string | null>(
    id,
    800
  );

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
