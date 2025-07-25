export interface SyncError {
  type: 'api' | 'database' | 'computation' | 'network' | 'unknown'
  message: string
  playerId?: number
  timestamp: string
  retryable: boolean
  context?: any
}

export class SyncErrorHandler {
  private errors: SyncError[] = []
  
  /**
   * Handle and categorize error
   */
  handleError(error: unknown, playerId?: number, context?: any): SyncError {
    const syncError = this.categorizeError(error, playerId, context)
    this.errors.push(syncError)
    
    // Log error
    console.error('Sync error:', syncError)
    
    return syncError
  }
  
  /**
   * Categorize error type and determine if retryable
   */
  private categorizeError(error: unknown, playerId?: number, context?: any): SyncError {
    const timestamp = new Date().toISOString()
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // API errors
      if (message.includes('fetch failed') || 
          message.includes('api request failed') ||
          message.includes('http error')) {
        return {
          type: 'api',
          message: error.message,
          playerId,
          timestamp,
          retryable: this.isRetryableApiError(error.message),
          context
        }
      }
      
      // Database errors
      if (message.includes('database') || 
          message.includes('supabase') ||
          message.includes('sql') ||
          message.includes('constraint')) {
        return {
          type: 'database',
          message: error.message,
          playerId,
          timestamp,
          retryable: this.isRetryableDatabaseError(error.message),
          context
        }
      }
      
      // Network errors
      if (message.includes('network') || 
          message.includes('timeout') ||
          message.includes('econnreset') ||
          message.includes('enotfound')) {
        return {
          type: 'network',
          message: error.message,
          playerId,
          timestamp,
          retryable: true,
          context
        }
      }
      
      // Computation errors
      if (message.includes('market value') ||
          message.includes('position rating') ||
          message.includes('calculation')) {
        return {
          type: 'computation',
          message: error.message,
          playerId,
          timestamp,
          retryable: false, // Computation errors usually aren't retryable
          context
        }
      }
    }
    
    // Unknown error
    return {
      type: 'unknown',
      message: error instanceof Error ? error.message : String(error),
      playerId,
      timestamp,
      retryable: false,
      context
    }
  }
  
  /**
   * Check if API error is retryable
   */
  private isRetryableApiError(message: string): boolean {
    const retryablePatterns = [
      /5\d{2}/, // 5xx server errors
      /429/, // Rate limit
      /timeout/i,
      /connection/i,
      /network/i
    ]
    
    return retryablePatterns.some(pattern => pattern.test(message))
  }
  
  /**
   * Check if database error is retryable
   */
  private isRetryableDatabaseError(message: string): boolean {
    const retryablePatterns = [
      /timeout/i,
      /connection/i,
      /deadlock/i,
      /lock/i
    ]
    
    const nonRetryablePatterns = [
      /constraint/i,
      /duplicate/i,
      /invalid/i,
      /syntax/i
    ]
    
    // If it's definitely not retryable, return false
    if (nonRetryablePatterns.some(pattern => pattern.test(message))) {
      return false
    }
    
    // If it matches retryable patterns, return true
    return retryablePatterns.some(pattern => pattern.test(message))
  }
  
  /**
   * Get all errors
   */
  getErrors(): SyncError[] {
    return [...this.errors]
  }
  
  /**
   * Get errors by type
   */
  getErrorsByType(type: SyncError['type']): SyncError[] {
    return this.errors.filter(error => error.type === type)
  }
  
  /**
   * Get retryable errors
   */
  getRetryableErrors(): SyncError[] {
    return this.errors.filter(error => error.retryable)
  }
  
  /**
   * Get error summary
   */
  getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {}
    
    this.errors.forEach(error => {
      summary[error.type] = (summary[error.type] || 0) + 1
    })
    
    return summary
  }
  
  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = []
  }
  
  /**
   * Get error rate
   */
  getErrorRate(totalProcessed: number): number {
    return totalProcessed > 0 ? this.errors.length / totalProcessed : 0
  }
  
  /**
   * Check if error rate is too high
   */
  isErrorRateTooHigh(totalProcessed: number, threshold: number = 0.1): boolean {
    return this.getErrorRate(totalProcessed) > threshold
  }
  
  /**
   * Generate error report
   */
  generateErrorReport(): string {
    if (this.errors.length === 0) {
      return 'No errors occurred during sync'
    }
    
    const summary = this.getErrorSummary()
    const retryableCount = this.getRetryableErrors().length
    
    let report = `Sync Error Report (${this.errors.length} total errors)\n`
    report += `=================================\n\n`
    
    report += `Error Summary:\n`
    Object.entries(summary).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`
    })
    
    report += `\nRetryable errors: ${retryableCount}\n`
    report += `Non-retryable errors: ${this.errors.length - retryableCount}\n\n`
    
    if (this.errors.length > 0) {
      report += `Recent errors:\n`
      this.errors.slice(-5).forEach((error, index) => {
        report += `  ${index + 1}. [${error.type}] ${error.message}\n`
        if (error.playerId) {
          report += `     Player ID: ${error.playerId}\n`
        }
        report += `     Time: ${error.timestamp}\n`
        report += `     Retryable: ${error.retryable}\n\n`
      })
    }
    
    return report
  }
}

/**
 * Utility function to retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  backoffFactor: number = 2
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
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt) + Math.random() * 1000,
        maxDelay
      )
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }
  
  getState(): string {
    return this.state
  }
  
  getFailures(): number {
    return this.failures
  }
}