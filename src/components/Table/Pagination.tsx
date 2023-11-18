import { cn } from "@/utils/helpers"
import { Listbox } from "@headlessui/react"
import { usePopper } from "./usePopper"
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid"
import { Portal } from "../Portal"

export function Pagination({
  table,
}) {
    let [trigger, container] = usePopper({
      placement: 'bottom-end',
      strategy: 'fixed',
      modifiers: [{ name: 'offset', options: { offset: [0, 10] } }],
  })
  return (
    <div className="flex items-center justify-between px-2 py-2 w-full">
      <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Listbox value={`${table.getState().pagination.pageSize}`}
            onChange={(value) => {
              table.setPageSize(Number(value))
            }}>
                <div className="relative">
                    <Listbox.Button ref={trigger} className="relative w-16 flex items-center justify-center space-x-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/70 pl-3 pr-8 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5">
                        <span className="block truncate">{table.getState().pagination.pageSize}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Portal>
                      <Listbox.Options ref={container} className="w-16 mt-1 max-h-60 overflow-auto rounded-lg bg-white dark:bg-slate-950 py-1 text-sm shadow-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 focus:outline-none">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <Listbox.Option
                                key={pageSize} value={`${pageSize}`}
                                className={({ active }) =>
                                    cn(
                                        active ? 'bg-slate-100 dark:bg-slate-900 dark:text-white' : 'text-slate-900 dark:text-slate-50',
                                        'relative cursor-default select-none py-2 pl-3 pr-9'
                                    )
                                }
                            >
                            {pageSize}
                          </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Portal>
            </div>
          </Listbox>
        </div>
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="relative hidden lg:flex items-center justify-centertext-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/70 px-2 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>
          <button
            className="relativeflex items-center justify-center text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/70 px-2 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            className="relative flex items-center justify-center text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/70 px-2 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <button
            className="relative hidden lg:flex items-center justify-center text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/70 px-2 py-1.5 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronDoubleRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
