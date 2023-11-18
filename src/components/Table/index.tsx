"use client";

import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { columns } from "./columns";
import { HeartIcon } from "@heroicons/react/24/solid";
import { Pagination } from "./Pagination";
import { Toolbar } from "./Toolbar";

export function Table({ user, players }) {
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "id",
      desc: false,
    },
  ]);
  const [columnVisibility, setColumnVisibility] = useState(
    typeof window !== "undefined" &&
      localStorage?.getItem("columnVisibility.store")
      ? JSON.parse(localStorage?.getItem("columnVisibility.store"))
      : {
          height: false,
          preferredFoot: false,
          pace: false,
          shooting: false,
          passing: false,
          dribbling: false,
          defense: false,
          physical: false,
        }
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  useEffect(() => {
    localStorage.setItem(
      "columnVisibility.store",
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  function selectFilter(row, columnId, value) {
    const selectedValues = value;
    const values = new Set(row.getValue(columnId));
    const included = [...selectedValues].every((selectedValue) =>
      values.has(selectedValue)
    );
    return included;
  }

  const table = useReactTable({
    data: players,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    filterFns: {
      select: selectFilter,
    },
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnFilters,
      pagination,
    },
    meta: {
      user,
    },
  });

  return (
    <div className="mt-8">
      <div className="pb-8">
        <Toolbar table={table} />
        <div className="h-full w-full overflow-x-scroll overflow-y-hidden pb-4">
          <table className="w-full min-w-[800px] divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-1 py-2.5 text-left text-sm font-semibold text-slate-950 dark:text-white ${
                        ["id"].includes(header.id) ? "w-20" : ""
                      } ${["name"].includes(header.id) ? "w-40" : ""} ${
                        [
                          "age",
                          "overall",
                          "pace",
                          "shooting",
                          "passing",
                          "dribbling",
                          "defense",
                          "physical",
                        ].includes(header.id)
                          ? "w-16"
                          : ""
                      } ${
                        ["nationality", "favourite"].includes(header.id)
                          ? "w-9 min-w-[36px]"
                          : ""
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="before:content-['\200C'] before:block before:-mt-5 after:content-['\200C'] after:block after:-mt-5">
              {players.length !== 0 ? (
                table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="h-11 whitespace-nowrap py-1 px-2 text-sm text-slate-700 dark:text-slate-300"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center text-slate-700 dark:text-slate-300"
                    >
                      No Results.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-700 dark:text-slate-300"
                  >
                    <div className="text-center flex-1 flex flex-col justify-center m-24">
                      <HeartIcon className="h-12 w-12 mx-auto text-red-500" />
                      <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                        No Favourites
                      </h3>
                      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                        Click the heart beside players to add to your
                        favourites.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              {table.getFooterGroups().map((footerGroup) => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
        <Pagination table={table} />
      </div>
    </div>
  );
}
