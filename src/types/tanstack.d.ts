import "@tanstack/react-table";

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    user?: {
      addr?: string;
    };
  }
}

declare module "@tanstack/table-core" {
  interface FilterFns {
    select: FilterFn<unknown>;
  }
}
