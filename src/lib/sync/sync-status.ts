import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SyncStatus {
  id: number
  sync_type: 'full' | 'individual' | 'listings'
  status: 'running' | 'completed' | 'failed'
  total_players: number
  synced_players: number
  failed_players: number
  started_at: string
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface SyncProgress {
  total: number
  synced: number
  failed: number
  percentage: number
  isRunning: boolean
  error?: string
}

/**
 * Create a new sync status record
 */
export async function createSyncStatus(
  type: 'full' | 'individual',
  totalPlayers: number
): Promise<number> {
  const { data, error } = await supabase
    .from('sync_status')
    .insert({
      sync_type: type,
      status: 'running',
      total_players: totalPlayers,
      synced_players: 0,
      failed_players: 0
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create sync status: ${error.message}`)
  }

  return data.id
}

/**
 * Update sync progress
 */
export async function updateSyncProgress(
  syncId: number,
  syncedPlayers: number,
  failedPlayers: number
): Promise<void> {
  const { error } = await supabase
    .from('sync_status')
    .update({
      synced_players: syncedPlayers,
      failed_players: failedPlayers
    })
    .eq('id', syncId)

  if (error) {
    throw new Error(`Failed to update sync progress: ${error.message}`)
  }
}

/**
 * Complete sync operation
 */
export async function completeSyncStatus(
  syncId: number,
  status: 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('sync_status')
    .update({
      status,
      completed_at: new Date().toISOString(),
      error_message: errorMessage || null
    })
    .eq('id', syncId)

  if (error) {
    throw new Error(`Failed to complete sync status: ${error.message}`)
  }
}

/**
 * Get current sync status
 */
export async function getCurrentSyncStatus(): Promise<SyncStatus | null> {
  const { data, error } = await supabase
    .from('sync_status')
    .select('*')
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to get sync status: ${error.message}`)
  }

  return data
}

/**
 * Get latest sync status (completed or running)
 */
export async function getLatestSyncStatus(): Promise<SyncStatus | null> {
  const { data, error } = await supabase
    .from('sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to get latest sync status: ${error.message}`)
  }

  return data
}

/**
 * Get sync progress for UI
 */
export async function getSyncProgress(): Promise<SyncProgress | null> {
  const currentSync = await getCurrentSyncStatus()
  
  if (!currentSync) {
    return null
  }

  const percentage = currentSync.total_players > 0 
    ? Math.round((currentSync.synced_players / currentSync.total_players) * 100)
    : 0

  return {
    total: currentSync.total_players,
    synced: currentSync.synced_players,
    failed: currentSync.failed_players,
    percentage,
    isRunning: currentSync.status === 'running',
    error: currentSync.error_message || undefined
  }
}

/**
 * Get sync history
 */
export async function getSyncHistory(limit: number = 10): Promise<SyncStatus[]> {
  const { data, error } = await supabase
    .from('sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to get sync history: ${error.message}`)
  }

  return data || []
}

/**
 * Check if a sync is currently running
 */
export async function isSyncRunning(): Promise<boolean> {
  const { data, error } = await supabase
    .from('sync_status')
    .select('id')
    .eq('status', 'running')
    .limit(1)

  if (error) {
    throw new Error(`Failed to check sync status: ${error.message}`)
  }

  return (data?.length || 0) > 0
}

/**
 * Clean up old sync records (keep last 100)
 */
export async function cleanupOldSyncRecords(): Promise<void> {
  const { data: oldRecords, error: fetchError } = await supabase
    .from('sync_status')
    .select('id')
    .order('started_at', { ascending: false })
    .range(100, 999999) // Skip first 100, get the rest

  if (fetchError) {
    console.error('Failed to fetch old sync records:', fetchError)
    return
  }

  if (oldRecords && oldRecords.length > 0) {
    const idsToDelete = oldRecords.map(record => record.id)
    
    const { error: deleteError } = await supabase
      .from('sync_status')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      console.error('Failed to delete old sync records:', deleteError)
    } else {
      console.log(`Cleaned up ${oldRecords.length} old sync records`)
    }
  }
}