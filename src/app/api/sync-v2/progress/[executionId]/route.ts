import { NextRequest } from 'next/server';
import { subscribeToProgress, type ProgressUpdate } from '@/lib/sync-v2/progress-broadcaster';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ executionId: string }> }
) {
  const params = await context.params;
  const executionId = parseInt(params.executionId);
  
  if (isNaN(executionId)) {
    return new Response('Invalid execution ID', { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        executionId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Subscribe to progress updates
      const unsubscribe = subscribeToProgress(executionId, (update: ProgressUpdate) => {
        try {
          const message = `data: ${JSON.stringify({
            type: 'progress',
            ...update,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          console.error('Error sending progress update:', error);
        }
      });

      // Handle client disconnect
      request.signal?.addEventListener('abort', () => {
        console.log(`SSE client disconnected for execution ${executionId}`);
        unsubscribe();
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });

      // Auto-cleanup after 30 minutes
      setTimeout(() => {
        console.log(`SSE auto-cleanup for execution ${executionId}`);
        unsubscribe();
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      }, 30 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}