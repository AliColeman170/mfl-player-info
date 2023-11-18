"use client";

import { Menu } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { usePopper } from "./usePopper";
import { cn } from "@/utils/helpers";
import { columnLabels } from "./columns";

export function ViewOptions({
  table,
  className,
}: {
  table;
  className?: string;
}) {
  let [trigger, container] = usePopper({
    placement: "bottom-end",
    strategy: "fixed",
    modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
  });
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      <div>
        <Menu.Button
          ref={trigger}
          className="flex items-center justify-center space-x-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-900/60 px-4 py-3 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
        >
          {
            <AdjustmentsHorizontalIcon
              className="h-5 w-5 text-slate-50"
              aria-hidden="true"
            />
          }
          <span className="text-slate-200">View</span>
        </Menu.Button>
      </div>
      <Menu.Items
        ref={container}
        className="relative z-20 min-w-[12rem] mt-1 max-h-60 overflow-auto rounded-lg bg-white dark:bg-slate-950 py-1 text-sm shadow-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 focus:outline-none"
      >
        <div className="py-1">
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
              return (
                <Menu.Item key={column.id}>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        column.toggleVisibility(!column.getIsVisible());
                      }}
                      className={cn(
                        `flex items-center py-2 px-4 capitalize w-full`,
                        active && "bg-slate-900"
                      )}
                    >
                      {column.getIsVisible() ? (
                        <CheckIcon
                          className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <div className="mr-3 h-4 w-4" />
                      )}
                      {columnLabels.find((i) => i.id === column.id).label}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
        </div>
      </Menu.Items>
    </Menu>
  );
}
