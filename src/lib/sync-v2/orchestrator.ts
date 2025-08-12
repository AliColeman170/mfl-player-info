import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { 
  startSyncExecution, 
  completeSyncExecution, 
  updateSyncProgress,
  getSyncConfig,
  setSyncConfig,
  type SyncResult 
} from './core';
import { createProgressReporter, cleanupProgress } from './progress-broadcaster';

// Import all stage functions
import { importPlayersBasicData } from './stages/players-import';
import { syncSales } from './stages/sales';
import { calculateMarketValues } from './stages/market-values';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORCHESTRATOR_STAGE = 'full_sync';

export interface SyncOrchestratorOptions {
  runHistoricalImports?: boolean; // Whether to run one-time imports
  skipStages?: string[]; // Stage names to skip
  onStageComplete?: (stageName: string, result: SyncResult) => void;
  onProgress?: (currentStage: number, totalStages: number, stageName: string) => void;
}

export interface StageDefinition {
  name: string;
  displayName: string;
  isOneTime: boolean;
  isRequired: boolean;
  execute: () => Promise<SyncResult>;
}

const SYNC_STAGES: StageDefinition[] = [
  {
    name: 'players_import',
    displayName: 'Players Import',
    isOneTime: false,
    isRequired: true,
    execute: () => importPlayersBasicData(),
  },
  {
    name: 'sales',
    displayName: 'Sales Sync',
    isOneTime: false,
    isRequired: true,
    execute: () => syncSales(),
  },
  {
    name: 'market_values',
    displayName: 'Market Value Calculation',
    isOneTime: false,
    isRequired: true,
    execute: () => calculateMarketValues(),
  },
];

/**
 * Run the complete 3-stage sync process
 */
export async function runFullSync(
  options: SyncOrchestratorOptions = {}
): Promise<{
  success: boolean;
  duration: number;
  stageResults: Record<string, SyncResult>;
  errors: string[];
  executionId: number;
}> {
  const startTime = Date.now();
  const stageResults: Record<string, SyncResult> = {};
  const errors: string[] = [];
  
  console.log('[Full Sync] Starting complete sync orchestrator...');
  
  const executionId = await startSyncExecution(ORCHESTRATOR_STAGE, 'api');
  const progressReporter = createProgressReporter(executionId, ORCHESTRATOR_STAGE, 'Full Sync');
  
  try {
    // Filter stages based on options
    let stagesToRun = SYNC_STAGES.filter(stage => {
      // Skip if explicitly requested
      if (options.skipStages?.includes(stage.name)) {
        console.log(`[Full Sync] Skipping stage: ${stage.displayName} (explicitly skipped)`);
        return false;
      }
      
      // Skip one-time stages if not requested or already completed
      if (stage.isOneTime && !options.runHistoricalImports) {
        console.log(`[Full Sync] Skipping stage: ${stage.displayName} (one-time stage, not requested)`);
        return false;
      }
      
      return true;
    });

    // Check if one-time stages are already completed
    if (options.runHistoricalImports) {
      for (const stage of stagesToRun) {
        if (stage.isOneTime) {
          const { data: stageInfo } = await supabase
            .from('sync_stages')
            .select('status, is_one_time')
            .eq('stage_name', stage.name)
            .single();
          
          if (stageInfo?.status === 'completed' && stageInfo.is_one_time) {
            console.log(`[Full Sync] Skipping stage: ${stage.displayName} (already completed)`);
            stagesToRun = stagesToRun.filter(s => s.name !== stage.name);
          }
        }
      }
    }

    console.log(`[Full Sync] Running ${stagesToRun.length} stages: ${stagesToRun.map(s => s.displayName).join(', ')}`);

    // Update last full sync start time
    await setSyncConfig('last_full_sync_started', new Date().toISOString());

    // Broadcast start
    progressReporter.started('Initializing full sync', {
      totalStages: stagesToRun.length,
      stageNames: stagesToRun.map(s => s.displayName),
    });

    let totalProcessed = 0;

    // Execute each stage in sequence
    for (let i = 0; i < stagesToRun.length; i++) {
      const stage = stagesToRun[i];
      const stageStartTime = Date.now();
      
      try {
        console.log(`[Full Sync] Starting stage ${i + 1}/${stagesToRun.length}: ${stage.displayName}`);
        
        // Progress callback
        if (options.onProgress) {
          options.onProgress(i + 1, stagesToRun.length, stage.displayName);
        }

        // Broadcast stage start
        progressReporter.progress(totalProcessed, undefined, `Starting ${stage.displayName}`, {
          currentStage: i + 1,
          totalStages: stagesToRun.length,
          stageName: stage.displayName,
        });

        const result = await stage.execute();
        const stageDuration = Date.now() - stageStartTime;
        
        stageResults[stage.name] = result;
        totalProcessed += result.recordsProcessed;

        if (result.success) {
          console.log(`[Full Sync] ✅ Stage ${stage.displayName} completed in ${Math.round(stageDuration / 1000)}s (${result.recordsProcessed} records)`);
          
          // Broadcast stage completion
          progressReporter.progress(totalProcessed, undefined, `Completed ${stage.displayName}`, {
            currentStage: i + 1,
            totalStages: stagesToRun.length,
            stageName: stage.displayName,
            stageRecords: result.recordsProcessed,
            stageDuration,
            stageSuccess: true,
          });
        } else {
          console.error(`[Full Sync] ❌ Stage ${stage.displayName} failed: ${result.errors.slice(0, 3).join('; ')}`);
          
          // Broadcast stage failure
          progressReporter.progress(totalProcessed, undefined, `Failed ${stage.displayName}`, {
            currentStage: i + 1,
            totalStages: stagesToRun.length,
            stageName: stage.displayName,
            stageSuccess: false,
            stageError: result.errors[0],
          });
          
          // For required stages, this is a critical failure
          if (stage.isRequired) {
            errors.push(`Critical stage failed: ${stage.displayName} - ${result.errors[0]}`);
            console.error(`[Full Sync] Critical stage failure, stopping sync`);
            break;
          } else {
            errors.push(`Optional stage failed: ${stage.displayName} - ${result.errors[0]}`);
          }
        }

        // Stage complete callback
        if (options.onStageComplete) {
          options.onStageComplete(stage.name, result);
        }

        // Update progress
        await updateSyncProgress(executionId, totalProcessed, 0, {
          currentStage: stage.displayName,
          stageNumber: i + 1,
          totalStages: stagesToRun.length,
          stageDuration,
        });

        // Brief pause between stages
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[Full Sync] Fatal error in stage ${stage.displayName}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Stage ${stage.displayName} fatal error: ${errorMsg}`);
        
        stageResults[stage.name] = {
          success: false,
          duration: Date.now() - stageStartTime,
          recordsProcessed: 0,
          recordsFailed: 0,
          errors: [errorMsg],
        };

        // Stop on critical stage failure
        if (stage.isRequired) {
          console.error(`[Full Sync] Critical stage error, stopping sync`);
          break;
        }
      }
    }

    // Final results
    const duration = Date.now() - startTime;
    const success = errors.length === 0;
    const completedStages = Object.values(stageResults).filter(r => r.success).length;

    // Update last full sync completion time if successful
    if (success) {
      await setSyncConfig('last_full_sync_completed', new Date().toISOString());
    }

    // Broadcast completion
    if (success) {
      progressReporter.completed(totalProcessed, duration, {
        completedStages,
        totalStages: stagesToRun.length,
      });
    } else {
      progressReporter.failed(errors.slice(0, 3).join('; '), {
        completedStages,
        totalStages: stagesToRun.length,
      });
    }

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 3).join('; ') : undefined
    );

    console.log(`[Full Sync] ${success ? '✅ Completed' : '❌ Failed'} full sync in ${Math.round(duration / 1000)}s`);
    console.log(`[Full Sync] Stages: ${completedStages}/${stagesToRun.length} successful, ${totalProcessed} total records processed`);

    // Cleanup progress after a delay to allow final updates to be sent
    setTimeout(() => cleanupProgress(executionId), 5000);

    return {
      success,
      duration,
      stageResults,
      errors,
      executionId,
    };

  } catch (error) {
    console.error('[Full Sync] Fatal orchestrator error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown orchestrator error';
    
    await completeSyncExecution(executionId, 'failed', errorMsg);
    
    return {
      success: false,
      duration: Date.now() - startTime,
      stageResults,
      errors: [errorMsg, ...errors],
      executionId,
    };
  }
}

/**
 * Run daily sync (incremental stages only)
 */
export async function runDailySync(): Promise<{
  success: boolean;
  duration: number;
  stageResults: Record<string, SyncResult>;
  errors: string[];
  executionId: number;
}> {
  console.log('[Daily Sync] Starting daily incremental sync...');
  
  return runFullSync({
    runHistoricalImports: false, // Skip one-time imports
    skipStages: [], // Run all incremental stages
  });
}

/**
 * Run initial setup sync (all stages including one-time imports)
 */
export async function runInitialSetupSync(): Promise<{
  success: boolean;
  duration: number;
  stageResults: Record<string, SyncResult>;
  errors: string[];
  executionId: number;
}> {
  console.log('[Initial Setup] Starting complete initial sync...');
  
  return runFullSync({
    runHistoricalImports: true, // Include one-time imports
    skipStages: [], // Run all stages
  });
}

/**
 * Get sync orchestrator statistics
 */
export async function getFullSyncStats() {
  const { data: lastExecution } = await supabase
    .from('sync_executions')
    .select('*')
    .eq('stage_name', ORCHESTRATOR_STAGE)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const lastStarted = await getSyncConfig('last_full_sync_started');
  const lastCompleted = await getSyncConfig('last_full_sync_completed');

  // Get status of all stages
  const { data: stageStatuses } = await supabase
    .from('sync_stages')
    .select('name, status, is_one_time')
    .in('name', SYNC_STAGES.map(s => s.name));

  return {
    lastExecution: lastExecution || null,
    lastStarted: lastStarted || null,
    lastCompleted: lastCompleted || null,
    stageStatuses: stageStatuses || [],
    totalStages: SYNC_STAGES.length,
  };
}