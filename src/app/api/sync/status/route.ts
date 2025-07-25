import { NextRequest, NextResponse } from 'next/server'
import { getSyncProgress, getLatestSyncStatus, getSyncHistory, getSyncStats } from '@/lib/sync'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'current'

    switch (type) {
      case 'current':
        const currentProgress = await getSyncProgress()
        return NextResponse.json(currentProgress)

      case 'latest':
        const latestStatus = await getLatestSyncStatus()
        return NextResponse.json(latestStatus)

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10')
        const history = await getSyncHistory(limit)
        return NextResponse.json(history)

      case 'stats':
        const stats = await getSyncStats()
        return NextResponse.json(stats)

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Sync status request failed:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}