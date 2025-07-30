import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  constructor(message: string, public statusCode: number) {
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
        console.log(`${stageName ? `[${stageName}] ` : ''}Rate limit hit (${error.statusCode}), backing off for ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      } else {
        delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`${stageName ? `[${stageName}] ` : ''}Request failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
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
    console.warn(`[Core] Could not check cancellation status for execution ${executionId}:`, error);
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
    console.log(`[Core] Sync execution ${executionId} has been cancelled, stopping sync`);
    throw new SyncCancelledException(`Sync execution ${executionId} was cancelled`);
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
    console.error(`Failed to update sync progress for execution ${executionId}:`, error);
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

  const duration = execution ? 
    new Date(completedAt).getTime() - new Date(execution.started_at).getTime() : 0;

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
    console.error(`Failed to update last success for stage ${stageName}:`, error);
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
    if (error.code === 'PGRST116') { // No rows returned
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
  const { error } = await supabase
    .from('sync_config')
    .upsert({
      config_key: key,
      config_value: value,
    }, {
      onConflict: 'config_key'
    });

  if (error) {
    console.error(`Failed to set sync config for ${key}:`, error);
    throw new Error(`Failed to set sync config: ${error.message}`);
  }
}

/**
 * Get stage information
 */
export async function getStageInfo(stageName: string): Promise<SyncStage | null> {
  const { data, error } = await supabase
    .from('sync_stages')
    .select('*')
    .eq('stage_name', stageName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
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