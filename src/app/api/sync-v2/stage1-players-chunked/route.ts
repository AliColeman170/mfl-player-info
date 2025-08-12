import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // Very short - just orchestrates

export async function POST(request: NextRequest) {
  try {
    const { action = 'start' } = await request.json().catch(() => ({}));
    
    if (action === 'start') {
      // Start the chunked import process
      console.log('[API] Starting chunked player import orchestrator');
      
      // Return immediately with instructions to start chunking
      return NextResponse.json({
        stage: 'stage1-players-chunked',
        action: 'continue',
        message: 'Chunked import started - continue with first chunk',
        continueFrom: null, // Start from beginning
        totalProgress: {
          estimatedTotal: 45000,
          processed: 0,
          percentage: 0,
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[API] Chunked orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage1-players-chunked',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    stage: 'stage1-players-chunked',
    description: 'Orchestrator for chunked player import to work around Vercel timeouts',
    method: 'POST',
    actions: ['start'],
    chunkSize: '2 pages (~3000 players per chunk)',
    estimatedChunks: '~15 chunks for full import',
  });
}