import { NextRequest, NextResponse } from 'next/server'
import { syncIndividualPlayer } from '@/lib/sync'

export const maxDuration = 60 // 1 minute for individual sync

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (userLimit.count >= limit) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id)
    
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    console.log(`Starting individual sync for player ${playerId}...`)
    
    const result = await syncIndividualPlayer(playerId, {
      forceSync: true, // Always sync when manually triggered
      maxRetries: 3,
      retryDelay: 1000
    })

    console.log(`Individual sync completed for player ${playerId}:`, result)

    return NextResponse.json({
      success: result.success,
      playerId,
      processedPlayers: result.processedPlayers,
      failedPlayers: result.failedPlayers,
      duration: result.duration,
      errors: result.errors
    })

  } catch (error) {
    const { id } = await params;
    console.error(`Individual sync failed for player ${id}:`, error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      playerId: parseInt(id)
    }, { status: 500 })
  }
}