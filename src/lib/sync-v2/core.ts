import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Player } from '@/types/global.types';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';
import { getPositionIndex } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Rate limiting configuration for /listings endpoint
 * API limit: 100 requests per 5 minutes (300 seconds)
 * Our delay: 3500ms = max 85 requests per 5 minutes (safety buffer)
 */
export const LISTINGS_API_RATE_LIMIT_DELAY = 3500;

/**
 * Rate limiting for /players endpoint (different from listings)
 * More generous rate limit, so we use a shorter delay
 */
export const PLAYERS_API_RATE_LIMIT_DELAY = 1000;

export interface SyncExecution {
  id: number;
  stage_name: string;
  execution_type: 'manual' | 'cron' | 'api';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  records_processed: number;
  records_failed: number;
  progress_data: any;
  error_message?: string;
  triggered_by?: string;
}

export interface SyncStage {
  id: number;
  stage_name: string;
  stage_order: number;
  description: string;
  is_one_time: boolean;
  last_run_at?: string;
  last_success_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: any;
  error_message?: string;
}

export interface SyncConfig {
  config_key: string;
  config_value: string;
  description: string;
}

export interface SyncResult {
  success: boolean;
  duration: number;
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
  metadata?: any;
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class SyncCancelledException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncCancelledException';
  }
}

/**
 * Enhanced retry with rate limiting support
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000,
  stageName?: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      let delay: number;

      // Special handling for rate limiting (403/429 errors)
      if (error instanceof RateLimitError) {
        delay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
        console.log(
          `${stageName ? `[${stageName}] ` : ''}Rate limit hit (${error.statusCode}), backing off for ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`
        );
      } else {
        delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(
          `${stageName ? `[${stageName}] ` : ''}Request failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`
        );
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start a sync execution
 */
export async function startSyncExecution(
  stageName: string,
  executionType: 'manual' | 'cron' | 'api' = 'api',
  triggeredBy?: string
): Promise<number> {
  const { data, error } = await supabase
    .from('sync_executions')
    .insert({
      stage_name: stageName,
      execution_type: executionType,
      status: 'running',
      records_processed: 0,
      records_failed: 0,
      progress_data: {},
      triggered_by: triggeredBy,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to start sync execution:', error);
    throw new Error(`Failed to start sync execution: ${error.message}`);
  }

  // Update stage status to running
  await updateStageStatus(stageName, 'running');

  console.log(`Started sync execution ${data.id} for stage: ${stageName}`);
  return data.id;
}

/**
 * Check if sync execution has been cancelled
 */
export async function isSyncCancelled(executionId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('sync_executions')
    .select('status')
    .eq('id', executionId)
    .single();

  if (error || !data) {
    console.warn(
      `[Core] Could not check cancellation status for execution ${executionId}:`,
      error
    );
    return false;
  }

  return data.status === 'cancelled';
}

/**
 * Update sync execution progress
 */
export async function updateSyncProgress(
  executionId: number,
  processed: number,
  failed: number,
  progressData?: any
): Promise<void> {
  // Check if sync has been cancelled before updating progress
  const cancelled = await isSyncCancelled(executionId);
  if (cancelled) {
    console.log(
      `[Core] Sync execution ${executionId} has been cancelled, stopping sync`
    );
    throw new SyncCancelledException(
      `Sync execution ${executionId} was cancelled`
    );
  }

  const updates: any = {
    records_processed: processed,
    records_failed: failed,
  };

  if (progressData) {
    updates.progress_data = progressData;
  }

  const { error } = await supabase
    .from('sync_executions')
    .update(updates)
    .eq('id', executionId);

  if (error) {
    console.error(
      `Failed to update sync progress for execution ${executionId}:`,
      error
    );
    // Don't throw - sync can continue even if progress update fails
  }
}

/**
 * Complete sync execution
 */
export async function completeSyncExecution(
  executionId: number,
  status: 'completed' | 'failed' | 'cancelled',
  errorMessage?: string
): Promise<void> {
  const completedAt = new Date().toISOString();

  // Get start time to calculate duration
  const { data: execution } = await supabase
    .from('sync_executions')
    .select('started_at, stage_name')
    .eq('id', executionId)
    .single();

  const duration = execution
    ? new Date(completedAt).getTime() - new Date(execution.started_at).getTime()
    : 0;

  const { error } = await supabase
    .from('sync_executions')
    .update({
      status,
      completed_at: completedAt,
      duration_ms: duration,
      error_message: errorMessage || null,
    })
    .eq('id', executionId);

  if (error) {
    console.error(`Failed to complete sync execution ${executionId}:`, error);
  }

  // Update stage status
  if (execution?.stage_name) {
    const stageStatus = status === 'completed' ? 'completed' : 'failed';
    await updateStageStatus(execution.stage_name, stageStatus, errorMessage);

    if (status === 'completed') {
      await updateStageLastSuccess(execution.stage_name);
    }
  }

  console.log(`Completed sync execution ${executionId} with status: ${status}`);
}

/**
 * Update stage status
 */
export async function updateStageStatus(
  stageName: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  errorMessage?: string,
  progress?: any
): Promise<void> {
  const updates: any = {
    status,
    last_run_at: new Date().toISOString(),
  };

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  if (progress) {
    updates.progress = progress;
  }

  const { error } = await supabase
    .from('sync_stages')
    .update(updates)
    .eq('stage_name', stageName);

  if (error) {
    console.error(`Failed to update stage status for ${stageName}:`, error);
  }
}

/**
 * Update stage last success
 */
export async function updateStageLastSuccess(stageName: string): Promise<void> {
  const { error } = await supabase
    .from('sync_stages')
    .update({
      last_success_at: new Date().toISOString(),
    })
    .eq('stage_name', stageName);

  if (error) {
    console.error(
      `Failed to update last success for stage ${stageName}:`,
      error
    );
  }
}

/**
 * Get sync configuration value
 */
export async function getSyncConfig(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('sync_config')
    .select('config_value')
    .eq('config_key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error(`Failed to get sync config for ${key}:`, error);
    return null;
  }

  return data.config_value;
}

/**
 * Set sync configuration value
 */
export async function setSyncConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('sync_config').upsert(
    {
      config_key: key,
      config_value: value,
    },
    {
      onConflict: 'config_key',
    }
  );

  if (error) {
    console.error(`Failed to set sync config for ${key}:`, error);
    throw new Error(`Failed to set sync config: ${error.message}`);
  }
}

/**
 * Get stage information
 */
export async function getStageInfo(
  stageName: string
): Promise<SyncStage | null> {
  const { data, error } = await supabase
    .from('sync_stages')
    .select('*')
    .eq('stage_name', stageName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error(`Failed to get stage info for ${stageName}:`, error);
    return null;
  }

  return data;
}

/**
 * Check if any sync is currently running
 */
export async function isSyncRunning(excludeStage?: string): Promise<boolean> {
  let query = supabase
    .from('sync_executions')
    .select('id')
    .eq('status', 'running');

  if (excludeStage) {
    query = query.neq('stage_name', excludeStage);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to check if sync is running:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Get comprehensive sync status
 */
export async function getSyncStatus(): Promise<any> {
  const { data, error } = await supabase.rpc('get_sync_status');

  if (error) {
    console.error('Failed to get sync status:', error);
    throw new Error(`Failed to get sync status: ${error.message}`);
  }

  return data;
}

/**
 * Process data in batches with progress tracking
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number, results: R[]) => void
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);

    results.push(...batchResults);

    if (onProgress) {
      onProgress(i + batch.length, items.length, batchResults);
    }

    // Small delay between batches to prevent overwhelming the system
    await sleep(100);
  }

  return results;
}

/**
 * Import a single player by ID when missing from database
 * Used to recover from foreign key constraint errors during sales/listings import
 */
export async function importMissingPlayer(playerId: number): Promise<boolean> {
  console.log(`[Core] Attempting to import missing player ${playerId}`);

  try {
    // Fetch player from API with retry
    const player = await withRetry(
      () => fetchPlayerFromAPI(playerId),
      3, // maxRetries
      PLAYERS_API_RATE_LIMIT_DELAY,
      'missing_player_import'
    );

    if (!player) {
      console.error(`[Core] Player ${playerId} not found in API`);
      return false;
    }

    // Transform to database format with computed fields
    const computedFields = calculateEssentialFields(player);

    const dbRecord = {
      // Basic player info
      id: player.id,
      first_name: player.metadata.firstName || null,
      last_name: player.metadata.lastName || null,
      age: player.metadata.age || null,
      height: player.metadata.height || null,
      nationality: player.metadata.nationalities?.[0] || null,
      primary_position: player.metadata.positions?.[0] || null,
      secondary_positions: player.metadata.positions?.slice(1) || [],
      preferred_foot: player.metadata.preferredFoot || null,
      is_retired: false, // Assume active if we're importing due to sales/listings

      // Player stats
      overall: player.metadata.overall || null,
      pace: player.metadata.pace || null,
      shooting: player.metadata.shooting || null,
      passing: player.metadata.passing || null,
      dribbling: player.metadata.dribbling || null,
      defense: player.metadata.defense || null,
      physical: player.metadata.physical || null,
      goalkeeping: player.metadata.goalkeeping || null,
      resistance: player.metadata.resistance || null,

      // Contract information
      has_pre_contract: player.hasPreContract || false,
      energy: player.energy || null,
      offer_status: player.offerStatus || null,
      offer_min_division: player.offerMinDivision || null,
      offer_min_revenue_share: player.offerMinRevenueShare || null,
      offer_auto_accept: player.offerAutoAccept || false,

      // Active contract data
      contract_id: player.activeContract?.id || null,
      contract_status: player.activeContract?.status || null,
      contract_kind: player.activeContract?.kind || null,
      revenue_share: player.activeContract?.revenueShare || null,
      total_revenue_share_locked:
        player.activeContract?.totalRevenueShareLocked || null,
      start_season: player.activeContract?.startSeason || null,
      nb_seasons: player.activeContract?.nbSeasons || null,
      auto_renewal: player.activeContract?.autoRenewal || false,
      contract_created_date_time:
        player.activeContract?.createdDateTime || null,
      clauses: player.activeContract?.clauses
        ? JSON.stringify(player.activeContract.clauses)
        : null,

      // Club information
      club_id: player.activeContract?.club?.id || null,
      club_name: player.activeContract?.club?.name || null,
      club_main_color: player.activeContract?.club?.mainColor || null,
      club_secondary_color: player.activeContract?.club?.secondaryColor || null,
      club_city: player.activeContract?.club?.city || null,
      club_division: player.activeContract?.club?.division || null,
      club_logo_version: player.activeContract?.club?.logoVersion || null,
      club_country: player.activeContract?.club?.country || null,
      club_type: player.activeContract?.club?.type || null,

      // Owner information
      owner_wallet_address: player.ownedBy?.walletAddress || null,
      owner_name: player.ownedBy?.name || null,
      owner_twitter: player.ownedBy?.twitter || null,
      owner_last_active: player.ownedBy?.lastActive || null,

      // Computed fields for sorting and display
      best_position: computedFields.best_position,
      best_ovr: computedFields.best_ovr,
      ovr_difference: computedFields.ovr_difference,
      position_index: computedFields.position_index,
      best_position_index: computedFields.best_position_index,
      position_ratings: computedFields.position_ratings,

      // Sync metadata
      basic_data_synced_at: new Date().toISOString(),
      sync_stage: 'basic_imported',
      last_synced_at: new Date().toISOString(),
      sync_version: 2, // v2 sync system

      // Data hash for change detection
      data_hash: generateDataHash(player),
    };

    // Insert player into database
    const { error } = await supabase
      .from('players')
      .upsert([dbRecord], { onConflict: 'id' });

    if (error) {
      console.error(
        `[Core] Failed to insert missing player ${playerId}:`,
        error
      );
      return false;
    }

    console.log(`[Core] Successfully imported missing player ${playerId}`);

    // Rate limiting delay
    await sleep(PLAYERS_API_RATE_LIMIT_DELAY);

    return true;
  } catch (error) {
    console.error(`[Core] Error importing missing player ${playerId}:`, error);
    return false;
  }
}

/**
 * Fetch a single player from the API
 */
async function fetchPlayerFromAPI(playerId: number): Promise<Player | null> {
  const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${playerId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      // Player doesn't exist in API
      return null;
    }

    const errorMessage = `API request failed: ${url} Error: HTTP ${response.status}: ${response.statusText}`;

    // Handle rate limiting specifically
    if (response.status === 403 || response.status === 429) {
      throw new RateLimitError(errorMessage, response.status);
    }

    throw new Error(errorMessage);
  }

  const player = await response.json();
  return player;
}

/**
 * Calculate essential computed fields for individual player import (lightweight version)
 */
function calculateEssentialFields(player: Player) {
  const positionRatings = getPlayerPositionFamiliarityRatings(player, true);
  const bestPositionData = positionRatings?.[0] || {
    position: player.metadata.positions?.[0] || 'Unknown',
    rating: player.metadata.overall || 0,
    difference: 0,
  };

  const primaryPosition = player.metadata.positions?.[0] || null;

  return {
    best_position: bestPositionData.position || null,
    best_ovr: bestPositionData.rating || null,
    ovr_difference: bestPositionData.difference || null,
    position_index: getPositionIndex(primaryPosition || 'Unknown'),
    best_position_index: getPositionIndex(
      bestPositionData.position || 'Unknown'
    ),
    position_ratings: positionRatings,
  };
}

/**
 * Generate a simple hash of player data for change detection
 */
function generateDataHash(player: Player): string {
  const key = `${player.id}-${player.metadata.overall}-${player.metadata.age}-${player.activeContract?.status || 'none'}-${player.ownedBy?.walletAddress || 'none'}`;
  return Buffer.from(key).toString('base64').slice(0, 32);
}
