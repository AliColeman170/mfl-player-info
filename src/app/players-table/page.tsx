'use client';

import { Suspense } from 'react';
import { FilterToolbar } from './components/filters/FilterToolbar';
import { PlayersTableContainer } from './components/PlayersTableContainer';
import { TableControlsProvider } from './contexts/TableControlsContext';

export default function PlayersTablePage() {
  return (
    <TableControlsProvider>
      <div className='flex h-screen flex-col gap-4'>
        <Suspense fallback={<div>Loading filters...</div>}>
          <FilterToolbar className='flex-shrink-0' />
        </Suspense>

        <Suspense
          fallback={
            <div className='flex h-full items-center justify-center'>
              Loading table...
            </div>
          }
        >
          <PlayersTableContainer />
        </Suspense>
      </div>
    </TableControlsProvider>
  );
}
