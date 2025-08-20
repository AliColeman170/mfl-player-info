export interface UpstashWorkflowExecution {
  id: string;
  workflow_run_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  progress: {
    phase?: string;
    totalFetched?: number;
    totalProcessed?: number;
    totalFailed?: number;
    progressPercent?: number;
    currentPage?: number;
    estimatedTotal?: number;
  };
  total_steps: number;
  completed_steps: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTriggerResult {
  success: boolean;
  workflowRunId?: string;
  message: string;
  error?: string;
}

export interface WorkflowStatusResponse {
  workflows: UpstashWorkflowExecution[];
}

export interface WorkflowOption {
  name: string;
  label: string;
  description: string;
  estimatedDuration?: string;
  estimatedSteps?: number;
}