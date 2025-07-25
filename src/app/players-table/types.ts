import { FilterState } from './lib/filter-schema'

// Re-export the main player type
import type { PlayerWithFavouriteData as BasePlayerWithFavouriteData } from '@/types/global.types'
export type PlayerWithFavouriteData = BasePlayerWithFavouriteData

// Local types for the players table
export interface PlayersTableFilters extends FilterState {}

export interface FilterOption {
  label: string
  value: string
  icon?: React.ReactNode
  count?: number
}

export interface ColumnConfig {
  id: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  hideable?: boolean
}

export interface TableSettings {
  pageSize: number
  enableInfiniteScroll: boolean
  virtualizeRows: boolean
  stickyHeader: boolean
}

// API types
export interface PlayersApiFilters {
  search?: string
  beforePlayerId?: string
  limit?: number
  favourites?: 'all' | 'favourites' | 'non-favourites'
  tags?: string[]
  tagsMatchAll?: boolean
  nationalities?: string[]
  positions?: string[]
  secondaryPositions?: string[]
  owners?: string[]
  clubs?: string[]
  bestPositions?: string[]
  walletAddress?: string
  preferredFoot?: string
  ageMin?: number
  ageMax?: number
  heightMin?: number
  heightMax?: number
  overallMin?: number
  overallMax?: number
  paceMin?: number
  paceMax?: number
  shootingMin?: number
  shootingMax?: number
  passingMin?: number
  passingMax?: number
  dribblingMin?: number
  dribblingMax?: number
  defenseMin?: number
  defenseMax?: number
  physicalMin?: number
  physicalMax?: number
  bestOverallMin?: number
  bestOverallMax?: number
  marketValueMin?: number
  marketValueMax?: number
  priceDiffMin?: number
  priceDiffMax?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PlayersApiResponse {
  players: PlayerWithFavouriteData[]
  nextCursor?: string
  hasNextPage: boolean
  totalCount?: number
}