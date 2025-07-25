import { Player } from '@/types/global.types'
import { createClient } from '@supabase/supabase-js'
import { calculateComputedFields, ComputedPlayerFields } from './computed-fields'
import { updateSyncProgress } from './sync-status'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BatchProcessResult {
  success: boolean
  processed: number
  errors: string[]
  totalProcessed: number
  totalFailed: number
}

export interface BatchProcessOptions {
  batchSize: number
  maxRetries: number
  retryDelay: number
  onProgress?: (processed: number, total: number) => void
}

const DEFAULT_OPTIONS: BatchProcessOptions = {
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
}

/**
 * Process a batch of players and store in database
 */
export async function processBatch(
  players: Player[],
  syncId: number,
  currentProgress: { processed: number; failed: number },
  options: BatchProcessOptions = DEFAULT_OPTIONS
): Promise<BatchProcessResult> {
  const errors: string[] = []
  let processed = 0
  let totalFailed = currentProgress.failed

  console.log(`Processing batch of ${players.length} players...`)

  // Process players in smaller chunks to avoid memory issues
  const chunks = chunkArray(players, options.batchSize)
  
  for (const chunk of chunks) {
    try {
      const computedPlayers = await Promise.allSettled(
        chunk.map(async (player) => {
          try {
            const computedFields = await calculateComputedFields(player)
            return {
              player,
              computedFields,
              success: true
            }
          } catch (error) {
            console.error(`Failed to compute fields for player ${player.id}:`, error)
            return {
              player,
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false
            }
          }
        })
      )

      // Separate successful and failed computations
      const successfulComputations = computedPlayers
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value)

      const failedComputations = computedPlayers
        .filter(result => 
          result.status === 'rejected' || 
          (result.status === 'fulfilled' && !result.value.success)
        )

      // Store successful computations in database
      if (successfulComputations.length > 0) {
        const dbRecords = successfulComputations.map(({ player, computedFields }) => ({
          // Basic player info
          id: player.id,
          first_name: player.metadata.firstName,
          last_name: player.metadata.lastName,
          age: player.metadata.age,
          height: player.metadata.height,
          nationality: player.metadata.nationalities?.[0] || null,
          primary_position: player.metadata.positions?.[0] || null,
          secondary_positions: player.metadata.positions?.slice(1) || [],
          preferred_foot: player.metadata.preferredFoot,
          
          // Player stats
          overall: player.metadata.overall,
          pace: player.metadata.pace,
          shooting: player.metadata.shooting,
          passing: player.metadata.passing,
          dribbling: player.metadata.dribbling,
          defense: player.metadata.defense,
          physical: player.metadata.physical,
          
          // Computed fields
          ...computedFields
        }))

        const { error: dbError } = await supabase
          .from('players')
          .upsert(dbRecords, { onConflict: 'id' })

        if (dbError) {
          console.error('Database upsert error:', dbError)
          errors.push(`Database error: ${dbError.message}`)
          totalFailed += successfulComputations.length
        } else {
          processed += successfulComputations.length
          console.log(`Successfully stored ${successfulComputations.length} players`)
        }
      }

      // Handle failed computations
      if (failedComputations.length > 0) {
        totalFailed += failedComputations.length
        failedComputations.forEach(result => {
          if (result.status === 'rejected') {
            errors.push(result.reason?.message || 'Unknown error')
          } else if (result.status === 'fulfilled' && !result.value.success) {
            errors.push(result.value.error || 'Unknown error')
          }
        })
      }

      // Update sync progress
      await updateSyncProgress(syncId, currentProgress.processed + processed, totalFailed)

      // Progress callback
      if (options.onProgress) {
        options.onProgress(processed, players.length)
      }

      // Small delay to prevent overwhelming the system
      await sleep(100)

    } catch (error) {
      console.error('Batch processing error:', error)
      errors.push(error instanceof Error ? error.message : 'Unknown batch error')
      totalFailed += chunk.length
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
    totalProcessed: currentProgress.processed + processed,
    totalFailed
  }
}

/**
 * Fetch players from external API in batches
 */
export async function fetchPlayersFromAPI(
  offset: number = 0,
  limit: number = 1500
): Promise<Player[]> {
  const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=${limit}&offset=${offset}`
  
  console.log(`Fetching players from API: offset=${offset}, limit=${limit}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  const players = await response.json()
  
  console.log(`Fetched ${players.length} players from API`)
  
  return players
}

/**
 * Fetch single player from external API
 */
export async function fetchSinglePlayerFromAPI(playerId: number): Promise<Player> {
  const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${playerId}`
  
  console.log(`Fetching single player from API: ${playerId}`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  console.log(`Fetched player ${playerId} from API`)
  
  return data.player
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  
  throw lastError
}