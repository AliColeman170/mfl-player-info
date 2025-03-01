import Link from 'next/link';
import { SortableColumnHeader } from './SortableColumnHeader';
import { cn, getRarityClassNames, positionOrderArray } from '@/utils/helpers';
import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { ArrowUpRightIcon } from '@heroicons/react/24/solid';
import { TagsList } from '../Tags/TagsList';
import { createColumnHelper } from '@tanstack/react-table';
import Image from 'next/image';
import { PlayerWithFavouriteData } from '@/types/global.types';

export const columnLabels = [
  {
    id: 'id',
    label: 'ID',
  },
  {
    id: 'nationality',
    label: 'Nationality',
  },
  {
    id: 'name',
    label: 'Name',
  },
  {
    id: 'age',
    label: 'Age',
  },
  {
    id: 'height',
    label: 'Height',
  },
  {
    id: 'preferredFoot',
    label: 'Foot',
  },
  {
    id: 'position',
    label: 'Primary',
  },
  {
    id: 'positions',
    label: 'Secondary',
  },
  {
    id: 'overall',
    label: 'Overall',
  },
  {
    id: 'pace',
    label: 'Pace',
  },
  {
    id: 'shooting',
    label: 'Shooting',
  },
  {
    id: 'passing',
    label: 'Passing',
  },
  {
    id: 'dribbling',
    label: 'Dribbling',
  },
  {
    id: 'defense',
    label: 'Defense',
  },
  {
    id: 'physical',
    label: 'Physical',
  },
  {
    id: 'bestPosition',
    label: 'Best Position',
  },
  {
    id: 'bestRating',
    label: 'Best Rating',
  },
  {
    id: 'difference',
    label: 'Difference',
  },
  {
    id: 'tags',
    label: 'Tags',
  },
];

const columnHelper = createColumnHelper<PlayerWithFavouriteData>();

export const columns = [
  columnHelper.accessor((row) => !!row.is_favourite, {
    id: 'favourite',
    header: () => null,
    cell: ({ row }) => (
      <ToggleFavouriteButton
        player={row.original}
        isFavourite={row.original.is_favourite ?? false}
        className='disabled:pointer-events-none disabled:opacity-40'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: true,
  }),
  columnHelper.accessor((row) => +row.id, {
    id: 'id',
    header: ({ column }) => <SortableColumnHeader column={column} label='ID' />,
    enableGlobalFilter: true,
  }),
  columnHelper.accessor((row) => row.metadata.nationalities[0], {
    id: 'nationality',
    header: () => null,
    cell: ({ getValue }) => {
      return (
        <Image
          className='h-5 w-5'
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
  }),
  columnHelper.accessor(
    (row) => `${row.metadata.firstName} ${row.metadata.lastName}`,
    {
      id: 'name',
      header: ({ column }) => (
        <SortableColumnHeader column={column} label='Name' />
      ),
      cell: ({ row, getValue }) => {
        return (
          <Link
            href={`/player/${row.original.id}`}
            className='text-primary hover:text-primary/80 font-semibold'
          >
            {getValue<string>()}
          </Link>
        );
      },
      sortingFn: (a, b) => {
        return a.original.metadata.lastName > b.original.metadata.lastName
          ? 1
          : -1;
      },
      enableGlobalFilter: true,
    }
  ),
  columnHelper.accessor('metadata.age', {
    id: 'age',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Age' />
    ),
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.height', {
    id: 'height',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='HGT' />
    ),
    cell: ({ getValue }) => `${getValue<number>()}cm`,
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.preferredFoot', {
    id: 'preferredFoot',
    header: ({ column }) => <SortableColumnHeader column={column} label='FT' />,
    cell: ({ getValue }) => (getValue<string>() === 'RIGHT' ? 'Right' : 'Left'),
    invertSorting: true,
  }),
  columnHelper.accessor((row) => row.metadata.positions[0], {
    id: 'position',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Pos' />
    ),
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
  }),
  columnHelper.accessor((row) => row.metadata.positions.slice(1).join(', '), {
    id: 'positions',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Alt' />
    ),
    sortingFn: (a, b, columnId) => {
      return positionOrderArray.indexOf(a.original.metadata.positions[1]) <
        positionOrderArray.indexOf(b.original.metadata.positions[1])
        ? 1
        : -1;
    },
    invertSorting: true,
    enableGlobalFilter: false,
    filterFn: (row, columnId, filterValue) => {
      return filterValue.some((val: string) =>
        row.original.metadata.positions.slice(1).includes(val)
      );
    },
  }),
  columnHelper.accessor('metadata.overall', {
    id: 'overall',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Ovr' />
    ),
    cell: ({ getValue }) => {
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.pace', {
    id: 'pace',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Pac' />
    ),
    cell: ({ getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.shooting', {
    id: 'shooting',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Sho' />
    ),
    cell: ({ getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.passing', {
    id: 'passing',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Pas' />
    ),
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.dribbling', {
    id: 'dribbling',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Dri' />
    ),
    cell: ({ row, getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.defense', {
    id: 'defense',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Def' />
    ),
    cell: ({ getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor('metadata.physical', {
    id: 'physical',
    header: ({ column }) => (
      <SortableColumnHeader column={column} label='Phy' />
    ),
    cell: ({ getValue }) => {
      if (getValue<number>() === 0) return null;
      return (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
            getValue<number>()
          )}`}
        >
          {getValue<number>()}
        </div>
      );
    },
    invertSorting: true,
    filterFn: 'inNumberRange',
  }),
  columnHelper.accessor(
    (row) => {
      if (row.metadata.positions[0] === 'GK') return row.metadata.positions[0];
      return row.position_ratings[0].positions.join(', ');
    },
    {
      id: 'bestPosition',
      header: ({ column }) => (
        <SortableColumnHeader column={column} label='Best P' />
      ),
      invertSorting: true,
    }
  ),
  columnHelper.accessor(
    (row) => {
      if (row.metadata.positions[0] === 'GK') return row.metadata.overall;
      return row.position_ratings[0].rating;
    },
    {
      id: 'bestRating',
      header: ({ column }) => (
        <SortableColumnHeader column={column} label='Best Ovr' />
      ),
      cell: ({ getValue }) => {
        if (getValue<number>() === 0 || !getValue<number>()) return null;
        return (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium ${getRarityClassNames(
              getValue<number>()
            )}`}
          >
            {getValue<number>()}
          </div>
        );
      },
      invertSorting: true,
    }
  ),
  columnHelper.accessor(
    (row) => {
      if (row.metadata.positions[0] === 'GK') return 0;
      return row.position_ratings[0].difference;
    },
    {
      id: 'difference',
      header: ({ column }) => (
        <SortableColumnHeader column={column} label='Dif' />
      ),
      cell: ({ row, getValue }) => {
        const value = getValue<number>();
        if (value === 0 || !value) 0;
        return (
          <div className={cn(`flex items-center justify-center space-x-1`)}>
            <span>{value}</span>
            {value > 0 ? (
              <ArrowUpRightIcon className='h-3 w-3 text-green-600' />
            ) : null}
            {value < 0 ? (
              <ArrowUpRightIcon className='h-3 w-3 text-red-600' />
            ) : null}
            {value === 0 ? <span className='h-3 w-3'></span> : null}
          </div>
        );
      },
      invertSorting: true,
    }
  ),
  columnHelper.accessor((row) => row.tags, {
    id: 'tags',
    header: () => (
      <div className='text-left text-xs font-medium uppercase'>Tags</div>
    ),
    cell: ({ row }) => {
      return (
        <TagsList
          playerId={row.original.id}
          tags={row.original.tags}
          isFavourite={row.original.is_favourite}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    //@ts-ignore
    filterFn: 'select',
    enableGlobalFilter: true,
    getUniqueValues: (row) => {
      if (!row.tags) return [];
      return row.tags?.map((tag) => tag);
    },
  }),
];
