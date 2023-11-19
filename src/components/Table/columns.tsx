import Link from "next/link";
import { SortableColumnHeader } from "./SortableColumnHeader";
import { cn, getRarityClassNames, positionOrderArray } from "@/utils/helpers";
import { ToggleFavouriteButton } from "../Favourites/ToggleFavouriteButton";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";
import { TagsList } from "../Tags/TagsList";
import { ColumnDef } from "@tanstack/react-table";
import { Player } from "./schema";
import Image from "next/image";

export const columnLabels = [
  {
    id: "id",
    label: "ID",
  },
  {
    id: "nationality",
    label: "Nationality",
  },
  {
    id: "name",
    label: "Name",
  },
  {
    id: "age",
    label: "Age",
  },
  {
    id: "height",
    label: "Height",
  },
  {
    id: "preferredFoot",
    label: "Foot",
  },
  {
    id: "position",
    label: "Primary",
  },
  {
    id: "positions",
    label: "Secondary",
  },
  {
    id: "overall",
    label: "Overall",
  },
  {
    id: "pace",
    label: "Pace",
  },
  {
    id: "shooting",
    label: "Shooting",
  },
  {
    id: "passing",
    label: "Passing",
  },
  {
    id: "dribbling",
    label: "Dribbling",
  },
  {
    id: "defense",
    label: "Defense",
  },
  {
    id: "physical",
    label: "Physical",
  },
  {
    id: "bestPosition",
    label: "Best Position",
  },
  {
    id: "bestRating",
    label: "Best Rating",
  },
  {
    id: "difference",
    label: "Difference",
  },
  {
    id: "tags",
    label: "Tags",
  },
];

export const columns: ColumnDef<Player>[] = [
  {
    id: "favourite",
    cell: ({ table, row }) => (
      <ToggleFavouriteButton
        user={table.options.meta.user}
        playerId={row.original.id}
        isFavourite={row.original.is_favourite}
        className="disabled:opacity-40 disabled:pointer-events-none"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "id",
    accessorFn: (row) => +row.id,
    header: ({ column }) => <SortableColumnHeader column={column} label="ID" />,
    enableGlobalFilter: true,
  },
  {
    id: "nationality",
    header: () => null,
    accessorFn: (row) => {
      return row.metadata.nationalities[0];
    },
    cell: ({ getValue }) => {
      return (
        <Image
          className="h-5 w-5"
          src={`https://app.playmfl.com/img/flags/${getValue<string>()}.svg`}
          alt={getValue<string>()}
          title={getValue<string>()}
          width={512}
          height={512}
          unoptimized
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    enableColumnFilter: true,
    enableGlobalFilter: false,
    filterFn: (row, columnId, filterValue) => {
      return filterValue.includes(row.getValue(columnId));
    },
  },
  {
    id: "name",
    accessorFn: (row) => {
      if (row.metadata.name) return row.metadata.name;
      return `${row.metadata.firstName[0]}. ${row.metadata.lastName}`;
    },
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row, getValue }) => {
      return (
        <Link
          href={`/player/${row.original.id}`}
          className="font-semibold text-indigo-500 hover:text-indigo-400"
        >
          {getValue<string>()}
        </Link>
      );
    },
    sortingFn: (a, b) => {
      if (a.original.metadata.name) {
        const [_, alastName] = a.original.metadata.name.split(" ");
        const [__, blastName] = b.original.metadata.name.split(" ");
        return alastName > blastName ? 1 : -1;
      }
      return a.original.metadata.lastName > b.original.metadata.lastName
        ? 1
        : -1;
    },
    enableGlobalFilter: true,
  },
  {
    id: "age",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Age" />
    ),
    accessorKey: "metadata.ageAtMint",
    filterFn: "inNumberRange",
  },
  {
    id: "height",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Height" />
    ),
    cell: ({ row, getValue }) => `${getValue<number>()}cm`,
    invertSorting: true,
    accessorKey: "metadata.height",
    filterFn: "inNumberRange",
  },
  {
    id: "preferredFoot",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Foot" />
    ),
    cell: ({ row, getValue }) =>
      getValue<string>() === "RIGHT" ? "Right" : "Left",
    invertSorting: true,
    accessorKey: "metadata.preferredFoot",
  },
  {
    id: "position",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Pos" />
    ),
    accessorFn: (row) => {
      return row.metadata.positions[0];
    },
    sortingFn: (a, b, columnId) => {
      return positionOrderArray.indexOf(a.getValue(columnId)) <
        positionOrderArray.indexOf(b.getValue(columnId))
        ? 1
        : -1;
    },
    invertSorting: true,
    enableGlobalFilter: false,
    filterFn: (row, columnId, filterValue) => {
      return filterValue.includes(row.getValue(columnId));
    },
  },
  {
    id: "positions",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Alt" />
    ),
    accessorFn: (row) => {
      return row.metadata.positions.slice(1).join(", ");
    },
    sortingFn: (a, b, columnId) => {
      return positionOrderArray.indexOf(a.original.metadata.positions[1]) <
        positionOrderArray.indexOf(b.original.metadata.positions[1])
        ? 1
        : -1;
    },
    invertSorting: true,
    enableGlobalFilter: false,
    filterFn: (row, columnId, filterValue) => {
      return filterValue.some((val) =>
        row.original.metadata.positions.slice(1).includes(val)
      );
    },
  },
  {
    id: "overall",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Ovr" />
    ),
    accessorKey: "metadata.overall",
    cell: ({ row, getValue }) => {
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "pace",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Pac" />
    ),
    accessorKey: "metadata.pace",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "shooting",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Sho" />
    ),
    accessorKey: "metadata.shooting",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "passing",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Pas" />
    ),
    accessorKey: "metadata.passing",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "dribbling",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Dri" />
    ),
    accessorKey: "metadata.dribbling",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "defense",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Def" />
    ),
    accessorKey: "metadata.defense",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "physical",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Phy" />
    ),
    accessorKey: "metadata.physical",
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: "inNumberRange",
  },
  {
    id: "bestPosition",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Best Pos" />
    ),
    accessorFn: (row) => {
      if (row.metadata.positions[0] === "GK") return row.metadata.positions[0];
      return row.positionRatings[0].positions.join(", ");
    },
    invertSorting: true,
  },
  {
    id: "bestRating",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Best Ovr" />
    ),
    accessorFn: (row) => {
      if (row.metadata.positions[0] === "GK") return row.metadata.overall;
      return row.positionRatings[0].rating;
    },
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0 || !getValue<number>()) return null;
      return (
        <div
          className={`flex justify-center items-center w-9 h-9 font-medium rounded-lg ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
  },
  {
    id: "difference",
    header: ({ column }) => (
      <SortableColumnHeader column={column} label="Dif" />
    ),
    accessorFn: (row) => {
      if (row.metadata.positions[0] === "GK") return 0;
      return row.positionRatings[0].difference;
    },
    cell: ({ row, getValue }) => {
      const value = getValue<number>();
      if (value === 0 || !value) 0;
      return (
        <div className={cn(`flex justify-center items-center space-x-1`)}>
          <span>{value}</span>
          {value > 0 ? (
            <ArrowUpRightIcon className="h-3 w-3 text-green-600" />
          ) : null}
          {value < 0 ? (
            <ArrowUpRightIcon className="h-3 w-3 text-red-600" />
          ) : null}
          {value === 0 ? <span className="h-3 w-3"></span> : null}
        </div>
      );
    },
    invertSorting: true,
  },
  {
    id: "tags",
    accessorFn: (row) => row.tags,
    header: "TAGS",
    cell: ({ table, row }) => {
      return <TagsList user={table.options.meta.user} player={row.original} />;
    },
    enableSorting: false,
    enableHiding: true,
    filterFn: "select",
    enableGlobalFilter: true,
    getUniqueValues: (row) => {
      if (!row.tags) return [];
      return row.tags?.map((tag) => tag);
    },
  },
];
