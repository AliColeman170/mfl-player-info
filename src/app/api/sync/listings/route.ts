import { NextRequest, NextResponse } from 'next/server'
import { performListingsSync } from '@/lib/sync'

export const maxDuration = 300 // 5 minutes for listings sync

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 300000): boolean {
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    console.log('Starting listings sync...')
    
    const result = await performListingsSync({
      maxRetries: 5,
      retryDelay: 2000
    })

    console.log('Listings sync completed:', result)

    return NextResponse.json({
      success: result.success,
      totalListings: result.totalListings,
      processedListings: result.processedListings,
      updatedPlayers: result.updatedPlayers,
      duration: result.duration,
      errors: result.errors
    })

  } catch (error) {
    console.error('Listings sync failed:', error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}