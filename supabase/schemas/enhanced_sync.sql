-- Enhanced sync system for 6-stage process

-- Sync stages configuration and tracking
CREATE TABLE IF NOT EXISTS "public"."sync_stages" (
    "id" bigserial PRIMARY KEY,
    "stage_name" text NOT NULL UNIQUE,
    "stage_order" integer NOT NULL,
    "description" text,
    "is_one_time" boolean DEFAULT false,
    "last_run_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "status" text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    "progress" jsonb DEFAULT '{}',
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Sync configuration for tracking IDs and settings
CREATE TABLE IF NOT EXISTS "public"."sync_config" (
    "id" bigserial PRIMARY KEY,
    "config_key" text NOT NULL UNIQUE,
    "config_value" text,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Enhanced sync execution log
CREATE TABLE IF NOT EXISTS "public"."sync_executions" (
    "id" bigserial PRIMARY KEY,
    "stage_name" text NOT NULL,
    "execution_type" text NOT NULL CHECK (execution_type IN ('manual', 'cron', 'api')),
    "status" text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    "started_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone,
    "duration_ms" bigint,
    "records_processed" integer DEFAULT 0,
    "records_failed" integer DEFAULT 0,
    "progress_data" jsonb DEFAULT '{}',
    "error_message" text,
    "triggered_by" text
);

-- Insert initial sync stages configuration
INSERT INTO "public"."sync_stages" (stage_name, stage_order, description, is_one_time) VALUES
('players_import', 1, 'Import basic player data without market value calculations', false),
('sales_historical', 2, 'One-time import of all historical sales data', true),
('listings_historical', 3, 'One-time import of all historical listings data', true),
('market_values', 4, 'Calculate market values using imported sales data', false),
('sales_live', 5, 'Ongoing sync of new sales data since last import', false),
('listings_live', 6, 'Ongoing sync of new listings data since last import', false),
('full_sync', 0, 'Complete orchestrator running all sync stages', false)
ON CONFLICT (stage_name) DO NOTHING;

-- Insert initial sync configuration
INSERT INTO "public"."sync_config" (config_key, config_value, description) VALUES
('first_sale_id', NULL, 'First sale ID imported during historical sync'),
('first_listing_id', NULL, 'First listing ID imported during historical sync'),
('last_sale_id_synced', NULL, 'Last sale ID processed in live sync'),
('last_listing_id_synced', NULL, 'Last listing ID processed in live sync'),
('sync_batch_size', '100', 'Default batch size for processing records'),
('api_rate_limit_delay', '3000', 'Delay between API calls in milliseconds'),
('max_retries', '5', 'Maximum retries for failed API calls')
ON CONFLICT (config_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_sync_stages_order" ON "public"."sync_stages" ("stage_order");
CREATE INDEX IF NOT EXISTS "idx_sync_stages_status" ON "public"."sync_stages" ("status");
CREATE INDEX IF NOT EXISTS "idx_sync_config_key" ON "public"."sync_config" ("config_key");
CREATE INDEX IF NOT EXISTS "idx_sync_executions_stage" ON "public"."sync_executions" ("stage_name", "started_at");
CREATE INDEX IF NOT EXISTS "idx_sync_executions_status" ON "public"."sync_executions" ("status");

-- Add columns to players table to track sync status
ALTER TABLE "public"."players" 
ADD COLUMN IF NOT EXISTS "basic_data_synced_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "market_value_calculated_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "sync_stage" text DEFAULT 'pending' CHECK (sync_stage IN ('pending', 'basic_imported', 'market_calculated', 'completed'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "idx_players_sync_stage" ON "public"."players" ("sync_stage");
CREATE INDEX IF NOT EXISTS "idx_players_basic_synced" ON "public"."players" ("basic_data_synced_at");
CREATE INDEX IF NOT EXISTS "idx_players_market_calculated" ON "public"."players" ("market_value_calculated_at");

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_stages_updated_at
    BEFORE UPDATE ON "public"."sync_stages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_config_updated_at
    BEFORE UPDATE ON "public"."sync_config"  
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RPC function to get comprehensive sync status
CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result jsonb;
    stage_data jsonb;
BEGIN
    -- Get overall sync status
    SELECT jsonb_build_object(
        'stages', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', stage_name,
                    'order', stage_order,
                    'status', status,
                    'isOneTime', is_one_time,
                    'lastRun', last_run_at,
                    'lastSuccess', last_success_at,
                    'progress', progress,
                    'error', error_message
                )
                ORDER BY stage_order
            )
            FROM public.sync_stages
        ),
        'config', (
            SELECT jsonb_object_agg(config_key, config_value)
            FROM public.sync_config
        ),
        'recentExecutions', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'stage', stage_name,
                    'status', status,
                    'startedAt', started_at,
                    'completedAt', completed_at,
                    'duration', duration_ms,
                    'recordsProcessed', records_processed,
                    'recordsFailed', records_failed
                )
                ORDER BY started_at DESC
            )
            FROM (
                SELECT * FROM public.sync_executions 
                ORDER BY started_at DESC 
                LIMIT 10
            ) recent
        ),
        'stats', (
            SELECT jsonb_build_object(
                'totalPlayers', (SELECT count(*) FROM public.players),
                'playersWithBasicData', (SELECT count(*) FROM public.players WHERE basic_data_synced_at IS NOT NULL),
                'playersWithMarketValues', (SELECT count(*) FROM public.players WHERE market_value_calculated_at IS NOT NULL),
                'totalSales', (SELECT count(*) FROM public.sales),
                'playersWithListings', (SELECT count(*) FROM public.players WHERE current_listing_id IS NOT NULL)
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Permissions
GRANT ALL ON TABLE "public"."sync_stages" TO "anon";
GRANT ALL ON TABLE "public"."sync_stages" TO "authenticated"; 
GRANT ALL ON TABLE "public"."sync_stages" TO "service_role";

GRANT ALL ON TABLE "public"."sync_config" TO "anon";
GRANT ALL ON TABLE "public"."sync_config" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_config" TO "service_role";

GRANT ALL ON TABLE "public"."sync_executions" TO "anon";
GRANT ALL ON TABLE "public"."sync_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_executions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sync_stages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sync_stages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sync_stages_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sync_executions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sync_executions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sync_executions_id_seq" TO "service_role";