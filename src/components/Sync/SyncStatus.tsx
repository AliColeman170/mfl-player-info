'use client'

import { useState, useEffect } from 'react'
import { SyncProgress, type SyncStatus } from '@/lib/sync'

interface SyncStatusProps {
  showHistory?: boolean
  refreshInterval?: number
}

export function SyncStatus({ showHistory = false, refreshInterval = 5000 }: SyncStatusProps) {
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [history, setHistory] = useState<SyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/sync/status?type=current')
      if (response.ok) {
        const data = await response.json()
        setProgress(data)
      }
    } catch (err) {
      setError('Failed to fetch sync progress')
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/sync/status?type=history&limit=5')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      setError('Failed to fetch sync history')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await fetchProgress()
      if (showHistory) {
        await fetchHistory()
      }
      setLoading(false)
    }

    fetchData()

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [showHistory, refreshInterval])

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Sync Status */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">Sync Status</h3>
        
        {progress ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {progress.synced} / {progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>Synced: {progress.synced}</span>
              <span>Failed: {progress.failed}</span>
            </div>
            
            {progress.error && (
              <div className="text-sm text-red-600 mt-2">
                Error: {progress.error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No sync currently running</p>
        )}
      </div>

      {/* Sync History */}
      {showHistory && history.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Recent Syncs</h3>
          <div className="space-y-2">
            {history.map((sync) => (
              <div key={sync.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <span className="text-sm font-medium capitalize">{sync.sync_type}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(sync.started_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    sync.status === 'completed' ? 'bg-green-100 text-green-800' :
                    sync.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sync.status}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {sync.synced_players} / {sync.total_players}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}