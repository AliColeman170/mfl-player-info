import { NextRequest, NextResponse } from 'next/server'
import { performFullSync } from '@/lib/sync'

export const maxDuration = 600 // 10 minutes for full sync

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily sync...')
    
    const result = await performFullSync({
      batchSize: 1500,
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (processed, total) => {
        console.log(`Daily sync progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`)
      }
    })

    console.log('Daily sync completed:', result)

    return NextResponse.json({
      success: result.success,
      totalPlayers: result.totalPlayers,
      processedPlayers: result.processedPlayers,
      failedPlayers: result.failedPlayers,
      duration: result.duration,
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : [] // Limit errors in response
    })

  } catch (error) {
    console.error('Daily sync failed:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}