"use client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { SearchInput } from "./SearchInput";
import { useDebounceValue } from "usehooks-ts";

export function SinglePlayerSearch({ id }: { id?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [debouncedPlayerId, setPlayerId] = useDebounceValue<string | null>(
    id,
    800
  );

  useEffect(() => {
    function searchPlayer(id) {
      if (id) {
        startTransition(() => {
          router.push(`/player/${id}`);
        });
      } else {
        router.push(`/`);
      }
    }
    searchPlayer(debouncedPlayerId);
  }, [debouncedPlayerId, router]);

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
