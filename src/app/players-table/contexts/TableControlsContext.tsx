'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'

type TableControls = {
  toggleColumn: (columnId: string) => void;
  showAllColumns: () => void;
  hideAllColumns: () => void;
  resetColumns: () => void;
  getCurrentVisibility: () => import('@tanstack/react-table').VisibilityState;
} | null

interface TableControlsContextType {
  tableControls: TableControls;
  setTableControls: (controls: TableControls) => void;
}

const TableControlsContext = createContext<TableControlsContextType | undefined>(undefined)

export function TableControlsProvider({ children }: { children: ReactNode }) {
  const [tableControls, setTableControls] = useState<TableControls>(null)

  const handleSetTableControls = useCallback((controls: TableControls) => {
    console.log('TableControlsProvider: received controls', controls)
    setTableControls(controls)
  }, [])

  return (
    <TableControlsContext.Provider value={{ 
      tableControls, 
      setTableControls: handleSetTableControls 
    }}>
      {children}
    </TableControlsContext.Provider>
  )
}

export function useTableControls() {
  const context = useContext(TableControlsContext)
  if (context === undefined) {
    throw new Error('useTableControls must be used within a TableControlsProvider')
  }
  return context
}