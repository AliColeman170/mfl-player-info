"use client";

import { useState, useTransition } from "react";
import { usePopper } from "../Table/usePopper";
import { Popover } from "@headlessui/react";
import { Portal } from "../Portal";
import { PlusIcon } from "@heroicons/react/24/solid";
import SpinnerIcon from "../SpinnerIcon";
import { updateTags } from "@/lib/actions";

export function AddTagButton({ player }) {
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();

  let [trigger, container] = usePopper({
    placement: "bottom-end",
    strategy: "fixed",
    modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
  });

  async function AddTag(callback) {
    const currentTags = player.tags || [];
    const updatedTags = [...currentTags, newTag];
    startTransition(() => {
      updateTags(player.id, updatedTags);
      setNewTag("");
      callback();
    });
  }

  return (
    <Popover className="relative">
      <Popover.Button
        ref={trigger}
        className="flex items-center justify-center space-x-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/60 px-1.5 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
      >
        <PlusIcon className="h-3 w-3" />
      </Popover.Button>

      <Portal>
        <Popover.Panel
          ref={container}
          className="absolute w-60 z-20 overflow-auto rounded-lg bg-white dark:bg-slate-950 text-sm shadow-2xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 focus:outline-none"
        >
          {({ close }) => (
            <div className="p-4">
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                Tag
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={`Add tag`}
                  className="block w-full bg-white dark:bg-slate-900 rounded-lg border-0 text-base py-3 px-3 text-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
                />
                <button
                  onClick={async () => {
                    await AddTag(close);
                  }}
                  className="flex w-20 items-center justify-center rounded-md text-sm bg-indigo-600 px-3 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {isPending ? (
                    <SpinnerIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </div>
          )}
        </Popover.Panel>
      </Portal>
    </Popover>
  );
}
