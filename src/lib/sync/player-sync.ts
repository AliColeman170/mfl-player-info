import { Player } from '@/types/global.types'
import { createClient } from '@supabase/supabase-js'
import { 
  createSyncStatus, 
  completeSyncStatus, 
  isSyncRunning,
  cleanupOldSyncRecords 
} from './sync-status'
import { 
  processBatch, 
  fetchPlayersFromAPI, 
  fetchSinglePlayerFromAPI,
  withRetry 
} from './batch-processor'
import { calculateComputedFields, hasPlayerDataChanged } from './computed-fields'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SyncOptions {
  batchSize?: number
  maxRetries?: number
  retryDelay?: number
  forceSync?: boolean
  onProgress?: (processed: number, total: number) => void
}

export interface SyncResult {
  success: boolean
  totalPlayers: number
  processedPlayers: number
  failedPlayers: number
  errors: string[]
  duration: number
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  batchSize: 1500,
  maxRetries: 3,
  retryDelay: 1000,
  forceSync: false
}

/**
 * Perform full sync of all players
 */
export async function performFullSync(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now()
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options }
  
  console.log('Starting full player sync...')
  
  // Check if sync is already running
  if (await isSyncRunning()) {
    throw new Error('Sync is already running')
  }
  
  let syncId: number | null = null
  let totalPlayers = 0
  let processedPlayers = 0
  let failedPlayers = 0
  const errors: string[] = []
  
  try {
    // Estimate total players (we'll update this as we go)
    totalPlayers = 200000 // Initial estimate
    
    // Create sync status record
    syncId = await createSyncStatus('full', totalPlayers)
    console.log(`Created sync status record: ${syncId}`)
    
    // Process players in batches
    let offset = 0
    let actualTotalPlayers = 0
    
    while (true) {
      try {
        // Fetch batch from API
        const players = await withRetry(
          () => fetchPlayersFromAPI(offset, opts.batchSize!),
          opts.maxRetries!,
          opts.retryDelay!
        )
        
        if (players.length === 0) {
          console.log('No more players to sync')
          break
        }
        
        actualTotalPlayers += players.length
        
        // Process batch
        const result = await processBatch(
          players,
          syncId,
          { processed: processedPlayers, failed: failedPlayers },
          {
            batchSize: 100, // Internal batch size for processing
            maxRetries: opts.maxRetries!,
            retryDelay: opts.retryDelay!,
            onProgress: opts.onProgress
          }
        )
        
        processedPlayers = result.totalProcessed
        failedPlayers = result.totalFailed
        errors.push(...result.errors)
        
        console.log(`Batch complete: processed ${result.processed}, failed ${result.errors.length}`)
        
        // Update progress callback
        if (opts.onProgress) {
          opts.onProgress(processedPlayers, actualTotalPlayers)
        }
        
        offset += opts.batchSize!
        
        // Break if we got less than expected (reached end)
        if (players.length < opts.batchSize!) {
          break
        }
        
      } catch (error) {
        console.error(`Batch sync error at offset ${offset}:`, error)
        errors.push(error instanceof Error ? error.message : 'Unknown batch error')
        
        // Continue to next batch on error
        offset += opts.batchSize!
        
        // Break if too many consecutive errors
        if (errors.length > 10) {
          console.error('Too many errors, stopping sync')
          break
        }
      }
    }
    
    // Update final totals
    totalPlayers = actualTotalPlayers
    
    // Complete sync
    const status = errors.length === 0 ? 'completed' : 'failed'
    const errorMessage = errors.length > 0 ? errors.join('; ') : undefined
    
    await completeSyncStatus(syncId, status, errorMessage)
    
    // Cleanup old records
    await cleanupOldSyncRecords()
    
    const duration = Date.now() - startTime
    console.log(`Full sync completed in ${duration}ms`)
    
    return {
      success: errors.length === 0,
      totalPlayers,
      processedPlayers,
      failedPlayers,
      errors,
      duration
    }
    
  } catch (error) {
    console.error('Full sync failed:', error)
    
    if (syncId) {
      await completeSyncStatus(
        syncId, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
    
    throw error
  }
}

/**
 * Sync individual player
 */
export async function syncIndividualPlayer(
  playerId: number,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now()
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options }
  
  console.log(`Starting individual player sync for ${playerId}...`)
  
  let syncId: number | null = null
  const errors: string[] = []
  
  try {
    // Create sync status record
    syncId = await createSyncStatus('individual', 1)
    
    // Check if player needs sync (unless forced)
    if (!opts.forceSync) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('data_hash')
        .eq('id', playerId)
        .single()
      
      if (existingPlayer) {
        // Fetch current player data to check if changed
        const currentPlayer = await fetchSinglePlayerFromAPI(playerId)
        
        if (!hasPlayerDataChanged(currentPlayer, existingPlayer.data_hash)) {
          console.log(`Player ${playerId} data unchanged, skipping sync`)
          await completeSyncStatus(syncId, 'completed')
          
          return {
            success: true,
            totalPlayers: 1,
            processedPlayers: 1,
            failedPlayers: 0,
            errors: [],
            duration: Date.now() - startTime
          }
        }
      }
    }
    
    // Fetch player from API
    const player = await withRetry(
      () => fetchSinglePlayerFromAPI(playerId),
      opts.maxRetries!,
      opts.retryDelay!
    )
    
    // Process single player
    const result = await processBatch(
      [player],
      syncId,
      { processed: 0, failed: 0 },
      {
        batchSize: 1,
        maxRetries: opts.maxRetries!,
        retryDelay: opts.retryDelay!,
        onProgress: opts.onProgress
      }
    )
    
    // Complete sync
    const status = result.errors.length === 0 ? 'completed' : 'failed'
    const errorMessage = result.errors.length > 0 ? result.errors.join('; ') : undefined
    
    await completeSyncStatus(syncId, status, errorMessage)
    
    const duration = Date.now() - startTime
    console.log(`Individual player sync completed in ${duration}ms`)
    
    return {
      success: result.errors.length === 0,
      totalPlayers: 1,
      processedPlayers: result.processed,
      failedPlayers: result.errors.length,
      errors: result.errors,
      duration
    }
    
  } catch (error) {
    console.error(`Individual player sync failed for ${playerId}:`, error)
    
    if (syncId) {
      await completeSyncStatus(
        syncId, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
    
    throw error
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
  const { data: playerCount } = await supabase
    .from('players')
    .select('id', { count: 'exact' })
  
  const { data: lastSync } = await supabase
    .from('sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  
  const { data: runningSyncs } = await supabase
    .from('sync_status')
    .select('*')
    .eq('status', 'running')
  
  return {
    totalPlayers: playerCount?.length || 0,
    lastSync: lastSync || null,
    isRunning: (runningSyncs?.length || 0) > 0,
    runningSyncs: runningSyncs || []
  }
}

/**
 * Cancel running sync (mark as failed)
 */
export async function cancelRunningSync(): Promise<void> {
  const { data: runningSyncs } = await supabase
    .from('sync_status')
    .select('id')
    .eq('status', 'running')
  
  if (runningSyncs && runningSyncs.length > 0) {
    await Promise.all(
      runningSyncs.map(sync => 
        completeSyncStatus(sync.id, 'failed', 'Cancelled by user')
      )
    )
  }
}