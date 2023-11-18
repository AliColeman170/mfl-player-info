import { ArrowDownIcon, ArrowUpIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'

export function SortableColumnHeader({column, label}) {
    return (
         <button
            className='flex items-center space-x-1'
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className='uppercase text-sm'>{label}</span>
          {column.getIsSorted() === "asc" && <ArrowDownIcon className="h-3 w-3" />}
          {column.getIsSorted() === "desc" && <ArrowUpIcon className="h-3 w-3" />}
          {!column.getIsSorted() && <ChevronUpDownIcon className="h-4 w-4" />}
        </button>
    )
}