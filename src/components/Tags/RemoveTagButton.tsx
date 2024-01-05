"use client";

import { updateTags } from "@/lib/actions";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useTransition } from "react";
import SpinnerIcon from "../SpinnerIcon";

export default function RemoveTagButton({ player, tagIndex }) {
  const [isPending, startTransition] = useTransition();
  async function deleteTag() {
    const updatedTags = [...player.tags] || [];
    updatedTags.splice(tagIndex, 1);
    startTransition(() => updateTags(player.id, updatedTags));
  }

  if (isPending) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg">
        <SpinnerIcon className="h-3 w-3 animate-spin text-white" />
      </div>
    );
  }

  return (
    <button
      onClick={() => deleteTag()}
      className="hidden group-hover:block absolute -top-1 -right-1 bg-indigo-600 hover:bg-indigo-600 text-xs p-0.5 rounded-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
    >
      <XMarkIcon className="h-3 w-3 text-white" />
    </button>
  );
}
