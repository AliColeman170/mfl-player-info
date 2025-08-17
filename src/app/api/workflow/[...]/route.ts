import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Listing, Player } from '@/types/global.types';
import { createWorkflow, serveMany } from '@upstash/workflow/nextjs';
import type {
  FailureFunctionPayload,
  WorkflowContext,
} from '@upstash/workflow';
import { updateMarketMultipliers } from '@/services/market-multiplier-updater';
import {
  getSyncConfig,
  setSyncConfig,
  upsertPlayersToDatabase,
  getQueryParams,
  getSalesQueryParams,
  upsertSalesToDatabase,
  getLastSaleCursor,
  MAX_PLAYERS_LIMIT,
  MAX_SALES_LIMIT,
  DEV_CUT_OFF,
  DEV_SALES_CUT_OFF,
  SALES_BATCH_SIZE,
} from '@/lib/upstash-workflow-helpers';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

const importActivePlayers = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-active-players',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    const configKey = 'last_player_id_imported';

    let hasMore = true;
    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let nextPlayerCursorId: number | undefined;

    // Step 1 - Get params for query
    const params = await context.run('get-query-params', async () => {
      console.log('[STEP 1] GetQuery Params');
      return await getQueryParams(
        configKey,
        false, // isRetired
        false // isBurned
      );
    });

    while (hasMore) {
      if (nextPlayerCursorId) {
        params.beforePlayerId = nextPlayerCursorId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?${queryString}`;

      // Step 2 - Fetch players
      const { body: players } = await context.call<Player[]>(
        'fetch-players', // Step name
        {
          url,
          method: 'GET', // HTTP method
        }
      );

      if (!players || players.length === 0) {
        console.log(
          `[Workflow] No more ${configKey} players - import complete.`
        );
        hasMore = false;
        break;
      }

      totalFetched += players.length;

      // Step 3 - Upsert players into database
      const { processed, failed } = await context.run(
        'upsert-players-to-database',
        async () => {
          console.log(
            `[STEP 3] Upsert Players ${players[0].id} to ${players[players.length - 1].id}`
          );
          return await upsertPlayersToDatabase(players);
        }
      );

      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalFetched,
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // Update progress and save checkpoint
      nextPlayerCursorId = players[players.length - 1]?.id;
      if (nextPlayerCursorId) {
        await setSyncConfig(configKey, nextPlayerCursorId.toString());
      }

      // Check if this was the last page for this type
      if (
        players.length < MAX_PLAYERS_LIMIT ||
        (process.env.NODE_ENV === 'development' &&
          totalProcessed >= DEV_CUT_OFF)
      ) {
        console.log(
          `[Workflow] ${configKey} players completed - ${totalFetched} total fetched.`
        );
        hasMore = false;
        await setSyncConfig(configKey, '0');
      }
    }

    console.log('[Workflow] Active Players import completed successfully.', {
      totalFetched,
      totalProcessed,
      totalFailed,
    });

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });
    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const importRetiredPlayers = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-retired-players',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    const configKey = 'last_retired_player_id_imported';

    let hasMore = true;
    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let nextPlayerCursorId: number | undefined;

    // Step 1 - Get params for query
    const params = await context.run('get-query-params', async () => {
      console.log('[STEP 1] GetQuery Params');
      return await getQueryParams(
        configKey,
        true, // isRetired
        false // isBurned
      );
    });

    while (hasMore) {
      if (nextPlayerCursorId) {
        params.beforePlayerId = nextPlayerCursorId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?${queryString}`;

      // Step 2 - Fetch players
      const { body: players } = await context.call<Player[]>(
        'fetch-players', // Step name
        {
          url,
          method: 'GET', // HTTP method
        }
      );

      if (!players || players.length === 0) {
        console.log(
          `[Workflow] No more ${configKey} players - import complete.`
        );
        hasMore = false;
        break;
      }

      totalFetched += players.length;

      // Step 3 - Upsert players into database
      const { processed, failed } = await context.run(
        'upsert-players-to-database',
        async () => {
          console.log(
            `[STEP 3] Upsert Players ${players[0].id} to ${players[players.length - 1].id}`
          );
          return await upsertPlayersToDatabase(players);
        }
      );

      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalFetched,
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // Update progress and save checkpoint
      nextPlayerCursorId = players[players.length - 1]?.id;
      if (nextPlayerCursorId) {
        await setSyncConfig(configKey, nextPlayerCursorId.toString());
      }

      // Check if this was the last page for this type
      if (players.length < MAX_PLAYERS_LIMIT) {
        console.log(
          `[Workflow] ${configKey} players completed - ${totalFetched} total fetched.`
        );
        hasMore = false;

        await setSyncConfig(configKey, '0');
      }
    }

    console.log('[Workflow] Retired Players import completed successfully.', {
      totalFetched,
      totalProcessed,
      totalFailed,
    });

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });
    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const importBurnedPlayers = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-burned-players',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    const configKey = 'last_burned_player_id_imported';

    let hasMore = true;
    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let nextPlayerCursorId: number | undefined;

    // Step 1 - Get params for query
    const params = await context.run('get-query-params', async () => {
      console.log('[STEP 1] GetQuery Params');
      return await getQueryParams(
        configKey,
        false, // isRetired
        true // isBurned
      );
    });

    while (hasMore) {
      if (nextPlayerCursorId) {
        params.beforePlayerId = nextPlayerCursorId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?${queryString}`;

      // Step 2 - Fetch players
      const { body: players } = await context.call<Player[]>(
        'fetch-players', // Step name
        {
          url,
          method: 'GET', // HTTP method
        }
      );

      if (!players || players.length === 0) {
        console.log(
          `[Workflow] No more ${configKey} players - import complete.`
        );
        hasMore = false;
        break;
      }

      totalFetched += players.length;

      // Step 3 - Upsert players into database
      const { processed, failed } = await context.run(
        'upsert-players-to-database',
        async () => {
          console.log(
            `[STEP 3] Upsert Players ${players[0].id} to ${players[players.length - 1].id}`
          );
          return await upsertPlayersToDatabase(players);
        }
      );

      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalFetched,
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // Update progress and save checkpoint
      nextPlayerCursorId = players[players.length - 1]?.id;
      if (nextPlayerCursorId) {
        await setSyncConfig(configKey, nextPlayerCursorId.toString());
      }

      // Check if this was the last page for this type
      if (players.length < MAX_PLAYERS_LIMIT) {
        console.log(
          `[Workflow] ${configKey} players completed - ${totalFetched} total fetched.`
        );
        hasMore = false;
        await setSyncConfig(configKey, '0');
      }
    }

    console.log('[Workflow] Burned Players import completed successfully.', {
      totalFetched,
      totalProcessed,
      totalFailed,
    });

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });

    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const importRetiredAndBurnedPlayers = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-retired-burned-players',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    const configKey = 'last_retired_burned_player_id_imported';

    let hasMore = true;
    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let nextPlayerCursorId: number | undefined;

    // Step 1 - Get params for query
    const params = await context.run('get-query-params', async () => {
      console.log('[STEP 1] GetQuery Params');
      return await getQueryParams(
        configKey,
        true, // isRetired
        true // isBurned
      );
    });

    while (hasMore) {
      if (nextPlayerCursorId) {
        params.beforePlayerId = nextPlayerCursorId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?${queryString}`;

      // Step 2 - Fetch players
      const { body: players } = await context.call<Player[]>(
        'fetch-players', // Step name
        {
          url,
          method: 'GET', // HTTP method
        }
      );

      if (!players || players.length === 0) {
        console.log(
          `[Workflow] No more ${configKey} players - import complete.`
        );
        hasMore = false;
        break;
      }

      totalFetched += players.length;

      // Step 3 - Upsert players into database
      const { processed, failed } = await context.run(
        'upsert-players-to-database',
        async () => {
          console.log(
            `[STEP 3] Upsert Players ${players[0].id} to ${players[players.length - 1].id}`
          );
          return await upsertPlayersToDatabase(players);
        }
      );

      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalFetched,
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // Update progress and save checkpoint
      nextPlayerCursorId = players[players.length - 1]?.id;
      if (nextPlayerCursorId) {
        await setSyncConfig(configKey, nextPlayerCursorId.toString());
      }

      // Check if this was the last page for this type
      if (players.length < MAX_PLAYERS_LIMIT) {
        console.log(
          `[Workflow] ${configKey} players completed - ${totalFetched} total fetched.`
        );
        hasMore = false;
        await setSyncConfig(configKey, '0');
      }
    }

    console.log(
      '[Workflow] Retired Burned Players import completed successfully.',
      {
        totalFetched,
        totalProcessed,
        totalFailed,
      }
    );

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });

    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const importAllPlayers = createWorkflow(
  // Define the workflow logic, specifying the type of the initial request body.
  // In this case, the body is a string:
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Initialize counters
    console.log('[Workflow] Starting import of all players');

    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-all-players',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    const [activeResults, retiredResults, burnedResults, retiredBurnedResults] =
      await Promise.all([
        context.invoke(
          'import-active-players', // Step name
          {
            workflow: importActivePlayers,
            body: {},
          }
        ),
        context.invoke(
          'import-retired-players', // Step name
          {
            workflow: importRetiredPlayers,
            body: {},
          }
        ),
        context.invoke(
          'import-burned-players', // Step name
          {
            workflow: importBurnedPlayers,
            body: {},
          }
        ),
        context.invoke(
          'import-retired-burned-players', // Step name
          {
            workflow: importRetiredAndBurnedPlayers,
            body: {},
          }
        ),
      ]);

    if (activeResults.body?.success) {
      totalFetched += activeResults.body.totalFetched;
      totalProcessed += activeResults.body.totalProcessed;
      totalFailed += activeResults.body.totalFailed;
    }
    if (retiredResults.body?.success) {
      totalFetched += retiredResults.body.totalFetched;
      totalProcessed += retiredResults.body.totalProcessed;
      totalFailed += retiredResults.body.totalFailed;
    }
    if (burnedResults.body?.success) {
      totalFetched += burnedResults.body.totalFetched;
      totalProcessed += burnedResults.body.totalProcessed;
      totalFailed += burnedResults.body.totalFailed;
    }
    if (retiredBurnedResults.body?.success) {
      totalFetched += retiredBurnedResults.body.totalFetched;
      totalProcessed += retiredBurnedResults.body.totalProcessed;
      totalFailed += retiredBurnedResults.body.totalFailed;
    }

    console.log('[Workflow] All Players import completed successfully.', {
      totalFetched,
      totalProcessed,
      totalFailed,
    });

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });

    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const importSales = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'import-sales',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    let hasMore = true;
    let totalFetched = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let nextListingCursorId: number | undefined;

    // Step 1 - Get params for query
    const params = await context.run('get-sales-query-params', async () => {
      console.log('[STEP 1] GetQuery Params');
      return await getSalesQueryParams();
    });

    while (hasMore) {
      if (nextListingCursorId) {
        params.beforeListingId = nextListingCursorId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?${queryString}`;

      // Step 2 - Fetch players
      const { body: listings } = await context.call<Listing[]>(
        'fetch-listings', // Step name
        {
          url,
          method: 'GET', // HTTP method
          flowControl: {
            key: 'sales-api',
            rate: 100, // 100 requests in period
            parallelism: 1, // Process one request at a time
            period: '5m', // 5 minutes period
          },
        }
      );

      if (!listings || listings.length === 0) {
        console.log(`[Workflow] No more listings - import complete.`);
        hasMore = false;
        break;
      }

      totalFetched += listings.length;

      // Step 3 - Upsert players into database
      const { processed, failed } = await context.run(
        'upsert-sales-to-database',
        async () => {
          console.log(
            `[STEP 3] Upsert Sales ${listings[0]?.listingResourceId} to ${listings[listings?.length - 1]?.listingResourceId}`
          );
          return await upsertSalesToDatabase(listings);
        }
      );

      totalProcessed += processed;
      totalFailed += failed;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalFetched,
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // Update progress and save checkpoint
      nextListingCursorId = listings[listings.length - 1]?.listingResourceId;

      // Check if this was the last page for this type
      if (
        listings.length < MAX_SALES_LIMIT ||
        (process.env.NODE_ENV === 'development' &&
          totalProcessed >= DEV_SALES_CUT_OFF)
      ) {
        console.log(
          `[Workflow] Sales completed - ${totalFetched} total fetched.`
        );
        hasMore = false;
      }
    }

    console.log('[Workflow] Sales import completed successfully.', {
      totalFetched,
      totalProcessed,
      totalFailed,
    });

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalFetched,
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });

    return { success: true, totalFetched, totalProcessed, totalFailed };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

const updateMarketValues = createWorkflow(
  async (context: WorkflowContext) => {
    const workflowRunId = context.workflowRunId;

    // Track workflow start
    await context.run('track-workflow-start', async () => {
      await supabase.from('upstash_workflow_executions').insert({
        workflow_run_id: workflowRunId,
        workflow_name: 'update-market-values',
        status: 'running',
        progress: { phase: 'initializing' },
      });
    });

    let totalProcessed = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    await context.run('update-market-multipliers', async () => {
      console.log('[STEP 1] Update Market Multipliers');
      return await updateMarketMultipliers({
        windowDays: 90,
        minSampleSize: 3,
        forceUpdate: true,
      });
    });

    await context.run('update-sales-summary', async () => {
      console.log('[STEP 2] Update Sales Summary');
      return await supabase.rpc('update_sales_summary');
    });

    const totalPlayers = await context.run('count-players', async () => {
      console.log('[STEP 3] Count Players');
      const { count: totalPlayers } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .not('overall', 'is', null);

      return totalPlayers || 0;
    });

    if (!totalPlayers || totalPlayers === 0) return;

    let currentOffset = 0;

    while (currentOffset < totalPlayers) {
      // Call the new batch processing function
      const { data: batchResults, error: batchError } = await context.run(
        'update-players-market-values',
        async () => {
          console.log('[STEP 4] Update Players Market Values');
          console.log(
            `[Market Values] Processing batch starting at offset ${currentOffset} (batch size: ${SALES_BATCH_SIZE})`
          );
          return await supabase.rpc('update_players_market_values_batch', {
            batch_size: SALES_BATCH_SIZE,
            offset_val: currentOffset,
          });
        }
      );

      if (batchError) {
        console.log(`Batch processing error: ${batchError.message}`);
        return;
      }

      const result = batchResults[0];
      const { processed_count, updated_count, error_count } = result;

      totalProcessed += updated_count;
      totalFailed += error_count;

      // Update progress in database
      await context.run(`update-progress-${totalProcessed}`, async () => {
        await supabase
          .from('upstash_workflow_executions')
          .update({
            progress: {
              phase: 'processing',
              totalProcessed,
              totalFailed,
            },
          })
          .eq('workflow_run_id', workflowRunId);
      });

      // If we processed fewer players than the batch size, we're done
      if (processed_count < SALES_BATCH_SIZE) {
        console.log(
          `[Market Values] Processed ${processed_count} < ${SALES_BATCH_SIZE}, reached end of players`
        );
        break;
      }

      currentOffset += processed_count;
    }

    const success = errors.length === 0;
    console.log(
      `[Market Values] Market values update completed. Success: ${success}, Processed: ${totalProcessed}, Failed: ${totalFailed}`
    );

    // Mark workflow as completed
    await context.run('mark-workflow-complete', async () => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'completed',
            totalProcessed,
            totalFailed,
            progressPercent: 100,
          },
        })
        .eq('workflow_run_id', workflowRunId);
    });

    return {
      success,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
    };
  },
  {
    failureFunction: async (failureData: {
      context: Omit<
        WorkflowContext<unknown>,
        | 'run'
        | 'sleepUntil'
        | 'sleep'
        | 'call'
        | 'waitForEvent'
        | 'notify'
        | 'cancel'
        | 'api'
        | 'invoke'
        | 'agents'
      >;
      failStatus: number;
      failResponse: string;
      failHeaders: Record<string, string[]>;
    }) => {
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: failureData.failResponse,
        })
        .eq('workflow_run_id', failureData.context.workflowRunId);
    },
  }
);

export const { POST } = serveMany({
  'import-all-players': importAllPlayers,
  'import-active-players': importActivePlayers,
  'import-retired-players': importRetiredPlayers,
  'import-burned-players': importBurnedPlayers,
  'import-retired-burned-players': importRetiredAndBurnedPlayers,
  'import-sales': importSales,
  'update-market-values': updateMarketValues,
});
