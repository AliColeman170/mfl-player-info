import 'server-only';

export interface ProgressUpdate {
  executionId: number;
  stageName: string;
  stageDisplayName: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  currentStep?: string;
  processedRecords?: number;
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
}

// In-memory store for progress updates (in production, use Redis or similar)
const progressStore = new Map<number, ProgressUpdate[]>();
const progressSubscribers = new Map<number, Set<(update: ProgressUpdate) => void>>();

/**
 * Broadcast progress update to all subscribers
 */
export function broadcastProgress(update: ProgressUpdate) {
  // Store the update
  if (!progressStore.has(update.executionId)) {
    progressStore.set(update.executionId, []);
  }
  progressStore.get(update.executionId)!.push(update);

  // Notify subscribers
  const subscribers = progressSubscribers.get(update.executionId);
  if (subscribers) {
    subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in progress subscriber:', error);
      }
    });
  }

  // Clean up old updates (keep last 50 per execution)
  const updates = progressStore.get(update.executionId)!;
  if (updates.length > 50) {
    updates.splice(0, updates.length - 50);
  }
}

/**
 * Subscribe to progress updates for an execution
 */
export function subscribeToProgress(
  executionId: number,
  callback: (update: ProgressUpdate) => void
): () => void {
  if (!progressSubscribers.has(executionId)) {
    progressSubscribers.set(executionId, new Set());
  }
  
  progressSubscribers.get(executionId)!.add(callback);

  // Send existing updates to new subscriber
  const existingUpdates = progressStore.get(executionId) || [];
  existingUpdates.forEach(update => {
    try {
      callback(update);
    } catch (error) {
      console.error('Error sending existing update to subscriber:', error);
    }
  });

  // Return unsubscribe function
  return () => {
    const subscribers = progressSubscribers.get(executionId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        progressSubscribers.delete(executionId);
      }
    }
  };
}

/**
 * Get stored progress updates for an execution
 */
export function getProgressUpdates(executionId: number): ProgressUpdate[] {
  return progressStore.get(executionId) || [];
}

/**
 * Clean up progress data for completed executions
 */
export function cleanupProgress(executionId: number) {
  progressStore.delete(executionId);
  progressSubscribers.delete(executionId);
}

/**
 * Create a progress reporter function for a stage
 */
export function createProgressReporter(
  executionId: number,
  stageName: string,
  stageDisplayName: string
) {
  return {
    started: (currentStep?: string, metadata?: Record<string, any>) => {
      broadcastProgress({
        executionId,
        stageName,
        stageDisplayName,
        status: 'started',
        currentStep,
        metadata,
      });
    },
    
    progress: (
      processedRecords: number,
      totalRecords?: number,
      currentStep?: string,
      metadata?: Record<string, any>
    ) => {
      broadcastProgress({
        executionId,
        stageName,
        stageDisplayName,
        status: 'progress',
        currentStep,
        processedRecords,
        totalRecords,
        metadata,
      });
    },
    
    completed: (
      processedRecords: number,
      duration: number,
      metadata?: Record<string, any>
    ) => {
      broadcastProgress({
        executionId,
        stageName,
        stageDisplayName,
        status: 'completed',
        processedRecords,
        duration,
        metadata,
      });
    },
    
    failed: (error: string, metadata?: Record<string, any>) => {
      broadcastProgress({
        executionId,
        stageName,
        stageDisplayName,
        status: 'failed',
        error,
        metadata,
      });
    },
  };
}