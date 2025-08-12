import 'server-only';
import {
  startSyncExecution,
  completeSyncExecution, 
  updateSyncProgress,
  getSyncConfig,
  setSyncConfig,
  type SyncResult,
} from './core';
import { importPlayersBasicDataChunk, type ChunkedSyncResult, importPlayersBasicData } from './stages/players-import';

// Full sync orchestrator types
export interface FullSyncOptions {
  runHistoricalImports?: boolean;
}

export interface FullSyncResult extends SyncResult {
  stageResults: Record<string, any>;
  totalStages: number;
  successfulStages: number;
}

export interface OrchestratorState {
  executionId: number;
  stage: string;
  totalProcessed: number;
  totalChunks: number;
  currentChunk: number;
  isComplete: boolean;
  continueFrom: any;
  errors: string[];
  startedAt: string;
}

export interface OrchestratorResult extends SyncResult {
  orchestratorId: string;
  isComplete: boolean;
  state?: OrchestratorState;
}

/**
 * Server-side orchestrator that manages chunked imports with persistence
 * Can survive page refreshes and continue running
 */
export class ChunkedImportOrchestrator {
  private orchestratorId: string;
  private state: OrchestratorState | null = null;

  constructor(orchestratorId?: string) {
    this.orchestratorId = orchestratorId || `orchestrator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save orchestrator state to database
   */
  private async saveState(state: OrchestratorState): Promise<void> {
    const stateKey = `orchestrator_state_${this.orchestratorId}`;
    await setSyncConfig(stateKey, JSON.stringify(state));
    this.state = state;
  }

  /**
   * Load orchestrator state from database  
   */
  private async loadState(): Promise<OrchestratorState | null> {
    if (this.state) return this.state;

    const stateKey = `orchestrator_state_${this.orchestratorId}`;
    const stateStr = await getSyncConfig(stateKey);
    
    if (stateStr && stateStr !== '0') {
      try {
        this.state = JSON.parse(stateStr);
        return this.state;
      } catch (error) {
        console.error('[Orchestrator] Failed to parse saved state:', error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Clear orchestrator state from database
   */
  private async clearState(): Promise<void> {
    const stateKey = `orchestrator_state_${this.orchestratorId}`;
    await setSyncConfig(stateKey, '0');
    this.state = null;
  }

  /**
   * Start or continue a chunked player import
   */
  async runChunkedPlayersImport(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    
    // Try to load existing state
    let state = await this.loadState();
    
    if (state) {
      console.log('[Orchestrator] Resuming chunked import from saved state:', {
        orchestratorId: this.orchestratorId,
        currentChunk: state.currentChunk,
        totalProcessed: state.totalProcessed,
      });
    } else {
      // Start new orchestration
      console.log('[Orchestrator] Starting new chunked import:', this.orchestratorId);
      
      const executionId = await startSyncExecution('players_import_orchestrator', 'api');
      
      state = {
        executionId,
        stage: 'players_import',
        totalProcessed: 0,
        totalChunks: 0,
        currentChunk: 1,
        isComplete: false,
        continueFrom: null,
        errors: [],
        startedAt: new Date().toISOString(),
      };
      
      await this.saveState(state);
    }

    try {
      // Run chunks until complete
      while (!state.isComplete) {
        console.log(`[Orchestrator] Running chunk ${state.currentChunk}...`);
        
        // Update progress in sync execution
        await updateSyncProgress(state.executionId, state.totalProcessed, 0, {
          orchestratorId: this.orchestratorId,
          currentChunk: state.currentChunk,
          stage: 'chunked_import',
        });

        // Run the chunk
        const chunkResult: ChunkedSyncResult = await importPlayersBasicDataChunk({
          maxPagesPerChunk: 2,
          continueFrom: state.continueFrom,
        });

        // Update state with chunk results
        state.totalProcessed += chunkResult.recordsProcessed || 0;
        state.totalChunks = state.currentChunk;
        state.isComplete = chunkResult.isComplete;
        state.continueFrom = chunkResult.continueFrom;
        
        if (chunkResult.errors.length > 0) {
          state.errors.push(...chunkResult.errors);
        }

        if (!chunkResult.success) {
          // Chunk failed - save state and return error
          await this.saveState(state);
          
          await completeSyncExecution(
            state.executionId, 
            'failed', 
            chunkResult.errors[0] || 'Chunk failed'
          );

          return {
            success: false,
            duration: Date.now() - startTime,
            recordsProcessed: state.totalProcessed,
            recordsFailed: 0,
            errors: state.errors,
            orchestratorId: this.orchestratorId,
            isComplete: false,
            state,
          };
        }

        // Save state after each successful chunk
        if (!state.isComplete) {
          state.currentChunk++;
          await this.saveState(state);
          
          console.log(`[Orchestrator] Chunk ${state.currentChunk - 1} complete. Total processed: ${state.totalProcessed}`);
          
          // Brief pause between chunks to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // All chunks complete!
      const duration = Date.now() - startTime;
      const success = state.errors.length === 0;
      
      console.log(`[Orchestrator] Chunked import complete!`, {
        orchestratorId: this.orchestratorId,
        totalChunks: state.totalChunks,
        totalProcessed: state.totalProcessed,
        success,
      });

      await completeSyncExecution(
        state.executionId,
        success ? 'completed' : 'failed',
        state.errors.length > 0 ? state.errors.slice(0, 3).join('; ') : undefined
      );

      // Clear the orchestrator state since we're done
      await this.clearState();

      return {
        success,
        duration,
        recordsProcessed: state.totalProcessed,
        recordsFailed: 0,
        errors: state.errors,
        orchestratorId: this.orchestratorId,
        isComplete: true,
        metadata: {
          totalChunks: state.totalChunks,
          orchestratorId: this.orchestratorId,
        },
      };

    } catch (error) {
      console.error('[Orchestrator] Fatal error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown orchestrator error';
      
      if (state) {
        state.errors.push(errorMsg);
        await this.saveState(state);
        
        await completeSyncExecution(state.executionId, 'failed', errorMsg);
      }

      return {
        success: false,
        duration: Date.now() - startTime,
        recordsProcessed: state?.totalProcessed || 0,
        recordsFailed: 0,
        errors: [errorMsg, ...(state?.errors || [])],
        orchestratorId: this.orchestratorId,
        isComplete: false,
        state,
      };
    }
  }

  /**
   * Get current status of the orchestrator
   */
  async getStatus(): Promise<{ 
    isRunning: boolean; 
    state: OrchestratorState | null; 
    orchestratorId: string;
  }> {
    const state = await this.loadState();
    return {
      isRunning: !!(state && !state.isComplete),
      state,
      orchestratorId: this.orchestratorId,
    };
  }

  /**
   * Cancel the orchestrator
   */
  async cancel(): Promise<void> {
    const state = await this.loadState();
    if (state && !state.isComplete) {
      await completeSyncExecution(state.executionId, 'failed', 'Cancelled by user');
      await this.clearState();
      console.log(`[Orchestrator] Cancelled: ${this.orchestratorId}`);
    }
  }
}

/**
 * Run full sync with all stages
 */
export async function runFullSync(options: FullSyncOptions = {}): Promise<FullSyncResult> {
  const startTime = Date.now();
  const executionId = await startSyncExecution('full_sync', 'api');
  
  const stageResults: Record<string, any> = {};
  const errors: string[] = [];
  
  try {
    console.log('[Full Sync] Starting complete sync process...');
    
    // Stage 1: Players Import (using orchestrator for reliability)
    console.log('[Full Sync] Stage 1: Players Import');
    const orchestrator = new ChunkedImportOrchestrator();
    stageResults.players_import = await orchestrator.runChunkedPlayersImport();
    
    if (!stageResults.players_import.success) {
      errors.push('Players import failed');
    }
    
    // Stage 2: Sales Sync (if players import succeeded)
    if (stageResults.players_import.success) {
      console.log('[Full Sync] Stage 2: Sales Sync');
      // TODO: Import sales sync function when available
      stageResults.sales = {
        success: true,
        message: 'Sales sync not implemented yet',
        recordsProcessed: 0,
        duration: 0,
      };
    } else {
      console.log('[Full Sync] Skipping sales sync due to players import failure');
      stageResults.sales = {
        success: false,
        message: 'Skipped due to players import failure',
        recordsProcessed: 0,
        duration: 0,
      };
    }
    
    // Stage 3: Market Values (if previous stages succeeded)
    if (stageResults.players_import.success && stageResults.sales.success) {
      console.log('[Full Sync] Stage 3: Market Values');
      // TODO: Import market values function when available
      stageResults.market_values = {
        success: true,
        message: 'Market values sync not implemented yet',
        recordsProcessed: 0,
        duration: 0,
      };
    } else {
      console.log('[Full Sync] Skipping market values due to previous stage failures');
      stageResults.market_values = {
        success: false,
        message: 'Skipped due to previous stage failures',
        recordsProcessed: 0,
        duration: 0,
      };
    }
    
    const successfulStages = Object.values(stageResults).filter(r => r.success).length;
    const totalStages = Object.keys(stageResults).length;
    const duration = Date.now() - startTime;
    const success = successfulStages === totalStages;
    
    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.join('; ') : undefined
    );
    
    console.log(`[Full Sync] Complete: ${successfulStages}/${totalStages} stages successful`);
    
    return {
      success,
      duration,
      recordsProcessed: Object.values(stageResults).reduce((sum: number, r: any) => sum + (r.recordsProcessed || 0), 0),
      recordsFailed: 0,
      errors,
      stageResults,
      totalStages,
      successfulStages,
    };
    
  } catch (error) {
    console.error('[Full Sync] Fatal error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown full sync error';
    
    await completeSyncExecution(executionId, 'failed', errorMsg);
    
    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors: [errorMsg, ...errors],
      stageResults,
      totalStages: Object.keys(stageResults).length,
      successfulStages: 0,
    };
  }
}

/**
 * Run daily sync (incremental updates)
 */
export async function runDailySync(): Promise<FullSyncResult> {
  console.log('[Daily Sync] Starting daily sync process...');
  return runFullSync({ runHistoricalImports: false });
}

/**
 * Run initial setup sync (complete import)
 */
export async function runInitialSetupSync(): Promise<FullSyncResult> {
  console.log('[Initial Setup] Starting initial setup sync...');
  return runFullSync({ runHistoricalImports: true });
}