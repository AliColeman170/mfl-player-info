'use client'

import { useState } from 'react'

interface SyncPlayerButtonProps {
  playerId: number
  onSyncComplete?: (success: boolean) => void
  className?: string
}

export function SyncPlayerButton({ playerId, onSyncComplete, className = '' }: SyncPlayerButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/sync/player/${playerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Player synced successfully' })
        onSyncComplete?.(true)
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Sync failed' 
        })
        onSyncComplete?.(false)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error occurred' 
      })
      onSyncComplete?.(false)
    } finally {
      setIsLoading(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className={`
          inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
          ${isLoading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Player
          </>
        )}
      </button>

      {message && (
        <div className={`text-xs px-2 py-1 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}