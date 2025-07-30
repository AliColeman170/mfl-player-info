import { NextRequest, NextResponse } from 'next/server';
import { importAllSalesData, getSalesImportStats } from '@/lib/sync/sales-import';

export const maxDuration = 600; // 10 minutes for sales import

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 300000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization (bypass in development)
    if (process.env.NODE_ENV !== 'development') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 3, 300000)) { // 3 requests per 5 minutes
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    console.log('Starting sales data import...');
    
    const result = await importAllSalesData({
      batchSize: 1000,
      maxRetries: 3,
      retryDelay: 1000,
      onProgress: (processed, total) => {
        console.log(`Sales import progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`);
      }
    });

    console.log('Sales import completed:', result);

    return NextResponse.json({
      success: result.success,
      totalSales: result.totalSales,
      newSales: result.newSales,
      updatedSales: result.updatedSales,
      duration: result.duration,
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : [] // Limit errors in response
    });

  } catch (error) {
    console.error('Sales import failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = await getSalesImportStats();
    
    return NextResponse.json({
      stats,
      success: true
    });

  } catch (error) {
    console.error('Failed to get sales stats:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}