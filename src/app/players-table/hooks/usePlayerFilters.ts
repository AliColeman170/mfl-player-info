'use client'

import { useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import { filterParsers, FilterState, DEFAULT_RANGES, SORT_FIELD_MAPPING } from '../lib/filter-schema'
import { PlayersApiFilters } from '../types'

export function usePlayerFilters() {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: true,
    clearOnDefault: true,
  })

  // Convert URL state to API filters
  const apiFilters = useMemo((): PlayersApiFilters => {
    const result: PlayersApiFilters = {}

    // Direct mappings
    if (filters.search) result.search = filters.search
    if (filters.favourites !== 'all') result.favourites = filters.favourites
    if (filters.status.length > 0) result.status = filters.status
    if (filters.tags.length > 0) result.tags = filters.tags
    if (filters.tags.length > 0) result.tagsMatchAll = filters.tagsMatchAll
    if (filters.nationalities.length > 0) result.nationalities = filters.nationalities
    if (filters.primaryPositions.length > 0) result.positions = filters.primaryPositions
    if (filters.secondaryPositions.length > 0) result.secondaryPositions = filters.secondaryPositions
    if (filters.owners.length > 0) result.owners = filters.owners
    if (filters.clubs.length > 0) result.clubs = filters.clubs
    if (filters.bestPositions.length > 0) result.bestPositions = filters.bestPositions
    if (filters.walletAddress) result.walletAddress = filters.walletAddress
    if (filters.preferredFoot) result.preferredFoot = filters.preferredFoot

    // Number ranges
    if (filters.ageMin !== null) result.ageMin = filters.ageMin
    if (filters.ageMax !== null) result.ageMax = filters.ageMax
    if (filters.heightMin !== null) result.heightMin = filters.heightMin
    if (filters.heightMax !== null) result.heightMax = filters.heightMax

    // Rating ranges
    if (filters.overallMin !== null) result.overallMin = filters.overallMin
    if (filters.overallMax !== null) result.overallMax = filters.overallMax
    if (filters.paceMin !== null) result.paceMin = filters.paceMin
    if (filters.paceMax !== null) result.paceMax = filters.paceMax
    if (filters.shootingMin !== null) result.shootingMin = filters.shootingMin
    if (filters.shootingMax !== null) result.shootingMax = filters.shootingMax
    if (filters.passingMin !== null) result.passingMin = filters.passingMin
    if (filters.passingMax !== null) result.passingMax = filters.passingMax
    if (filters.dribblingMin !== null) result.dribblingMin = filters.dribblingMin
    if (filters.dribblingMax !== null) result.dribblingMax = filters.dribblingMax
    if (filters.defenseMin !== null) result.defenseMin = filters.defenseMin
    if (filters.defenseMax !== null) result.defenseMax = filters.defenseMax
    if (filters.physicalMin !== null) result.physicalMin = filters.physicalMin
    if (filters.physicalMax !== null) result.physicalMax = filters.physicalMax
    
    // New range filters
    if (filters.bestOverallMin !== null) result.bestOverallMin = filters.bestOverallMin
    if (filters.bestOverallMax !== null) result.bestOverallMax = filters.bestOverallMax
    if (filters.marketValueMin !== null) result.marketValueMin = filters.marketValueMin
    if (filters.marketValueMax !== null) result.marketValueMax = filters.marketValueMax
    if (filters.priceDiffMin !== null) result.priceDiffMin = filters.priceDiffMin
    if (filters.priceDiffMax !== null) result.priceDiffMax = filters.priceDiffMax

    // Sorting - map column ID to API field name
    if (filters.sortBy) {
      const apiSortField = SORT_FIELD_MAPPING[filters.sortBy as keyof typeof SORT_FIELD_MAPPING]
      if (apiSortField) {
        result.sortBy = apiSortField
      }
    }
    if (filters.sortOrder) result.sortOrder = filters.sortOrder

    return result
  }, [filters])

  // Helper functions
  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      favourites: 'all',
      status: [],
      tags: [],
      tagsMatchAll: false,
      nationalities: [],
      primaryPositions: [],
      secondaryPositions: [],
      owners: [],
      clubs: [],
      bestPositions: [],
      walletAddress: '',
      preferredFoot: null,
      ageMin: null,
      ageMax: null,
      heightMin: null,
      heightMax: null,
      overallMin: null,
      overallMax: null,
      paceMin: null,
      paceMax: null,
      shootingMin: null,
      shootingMax: null,
      passingMin: null,
      passingMax: null,
      dribblingMin: null,
      dribblingMax: null,
      defenseMin: null,
      defenseMax: null,
      physicalMin: null,
      physicalMax: null,
      bestOverallMin: null,
      bestOverallMax: null,
      marketValueMin: null,
      marketValueMax: null,
      priceDiffMin: null,
      priceDiffMax: null,
      sortBy: '',
      sortOrder: null,
    })
  }, [setFilters])

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters({ [key]: value })
  }, [setFilters])

  const updateNumberRange = useCallback((
    field: 'age' | 'height' | 'overall' | 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defense' | 'physical' | 'bestOverall' | 'marketValue' | 'priceDiff',
    min?: number,
    max?: number
  ) => {
    setFilters({
      [`${field}Min`]: min ?? null,
      [`${field}Max`]: max ?? null,
    })
  }, [setFilters])

  const updateSorting = useCallback((columnId: string, order: 'asc' | 'desc' | null) => {
    if (order === null) {
      setFilters({
        sortBy: '',
        sortOrder: null,
      })
    } else {
      setFilters({
        sortBy: columnId,
        sortOrder: order,
      })
    }
  }, [setFilters])


  const isFiltered = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.favourites !== 'all' ||
      filters.status.length > 0 ||
      filters.tags.length > 0 ||
      filters.nationalities.length > 0 ||
      filters.primaryPositions.length > 0 ||
      filters.secondaryPositions.length > 0 ||
      filters.owners.length > 0 ||
      filters.clubs.length > 0 ||
      filters.bestPositions.length > 0 ||
      filters.walletAddress !== '' ||
      filters.preferredFoot !== null ||
      filters.ageMin !== null ||
      filters.ageMax !== null ||
      filters.heightMin !== null ||
      filters.heightMax !== null ||
      filters.overallMin !== null ||
      filters.overallMax !== null ||
      filters.paceMin !== null ||
      filters.paceMax !== null ||
      filters.shootingMin !== null ||
      filters.shootingMax !== null ||
      filters.passingMin !== null ||
      filters.passingMax !== null ||
      filters.dribblingMin !== null ||
      filters.dribblingMax !== null ||
  
      filters.defenseMin !== null ||
      filters.defenseMax !== null ||
      filters.physicalMin !== null ||
      filters.physicalMax !== null ||
      filters.bestOverallMin !== null ||
      filters.bestOverallMax !== null ||
      filters.marketValueMin !== null ||
      filters.marketValueMax !== null ||
      filters.priceDiffMin !== null ||
      filters.priceDiffMax !== null
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.favourites !== 'all') count++
    if (filters.status.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.nationalities.length > 0) count++
    if (filters.primaryPositions.length > 0) count++
    if (filters.secondaryPositions.length > 0) count++
    if (filters.owners.length > 0) count++
    if (filters.clubs.length > 0) count++
    if (filters.bestPositions.length > 0) count++
    if (filters.walletAddress) count++
    if (filters.preferredFoot) count++
    if (filters.ageMin !== null || filters.ageMax !== null) count++
    if (filters.heightMin !== null || filters.heightMax !== null) count++
    if (filters.overallMin !== null || filters.overallMax !== null) count++
    if (filters.paceMin !== null || filters.paceMax !== null) count++
    if (filters.shootingMin !== null || filters.shootingMax !== null) count++
    if (filters.passingMin !== null || filters.passingMax !== null) count++
    if (filters.dribblingMin !== null || filters.dribblingMax !== null) count++
    if (filters.defenseMin !== null || filters.defenseMax !== null) count++
    if (filters.physicalMin !== null || filters.physicalMax !== null) count++
    if (filters.bestOverallMin !== null || filters.bestOverallMax !== null) count++
    if (filters.marketValueMin !== null || filters.marketValueMax !== null) count++
    if (filters.priceDiffMin !== null || filters.priceDiffMax !== null) count++
    return count
  }, [filters])

  return {
    filters,
    apiFilters,
    setFilters,
    updateFilter,
    updateNumberRange,
    updateSorting,
    clearAllFilters,
    isFiltered,
    activeFilterCount,
  }
}