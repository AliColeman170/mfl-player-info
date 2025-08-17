import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/workflow';

const client = new Client({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { workflowName } = await request.json();

    if (!workflowName) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      );
    }

    console.log(`Triggering workflow: ${workflowName}`);

    const result = await client.trigger({
      url: `${process.env.NEXT_SITE_URL}/api/workflow/${workflowName}`,
      body: {},
    });

    return NextResponse.json({
      success: true,
      workflowRunId: result.workflowRunId,
      workflowName,
    });
  } catch (error) {
    console.error('Failed to trigger workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
