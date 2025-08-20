'use client'

import { useState, useEffect, useCallback } from 'react'
import { VisibilityState } from '@tanstack/react-table'
import { columnConfig, columnLabels } from '../components/table/columns'

const STORAGE_KEY = 'players-table-column-visibility'

// Create default visibility state with all columns
const createDefaultVisibilityState = (): VisibilityState => {
  return Object.keys(columnLabels).reduce((acc, columnId) => {
    acc[columnId] = columnConfig.defaultVisible.includes(columnId)
    return acc
  }, {} as VisibilityState)
}

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Try to load from localStorage immediately during initialization
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedState = JSON.parse(stored) as VisibilityState
          
          // Ensure all columns exist in the stored state
          const completeState = Object.keys(columnLabels).reduce((acc, columnId) => {
            acc[columnId] = parsedState[columnId] ?? columnConfig.defaultVisible.includes(columnId)
            return acc
          }, {} as VisibilityState)
          
          return completeState
        }
      } catch (error) {
        console.warn('Failed to load column visibility from localStorage:', error)
      }
    }
    
    // Fall back to default state
    return createDefaultVisibilityState()
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility))
    } catch (error) {
      console.warn('Failed to save column visibility to localStorage:', error)
    }
  }, [columnVisibility])

  const updateColumnVisibility = useCallback((columnId: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: visible,
    }))
  }, [])

  const setColumnVisibilityState = useCallback((state: VisibilityState) => {
    setColumnVisibility(state)
  }, [])

  const resetColumnVisibility = useCallback(() => {
    const defaultState = createDefaultVisibilityState()
    setColumnVisibility(defaultState)
  }, [])

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId],
    }))
  }, [])

  const showAllColumns = useCallback(() => {
    const allColumns = Object.keys(columnLabels)
    const newState = allColumns.reduce((acc, columnId) => {
      // Always visible columns stay visible, others become visible
      acc[columnId] = true
      return acc
    }, {} as VisibilityState)
    setColumnVisibility(newState)
  }, [])

  const hideAllColumns = useCallback(() => {
    const allColumns = Object.keys(columnLabels)
    const newState = allColumns.reduce((acc, columnId) => {
      // Keep always visible columns visible, hide others
      acc[columnId] = columnConfig.alwaysVisible.includes(columnId)
      return acc
    }, {} as VisibilityState)
    setColumnVisibility(newState)
  }, [])

  return {
    columnVisibility,
    setColumnVisibility: setColumnVisibilityState,
    updateColumnVisibility,
    resetColumnVisibility,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
  }
}