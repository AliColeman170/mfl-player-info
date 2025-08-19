-- Sync configuration for tracking IDs and settings
CREATE TABLE IF NOT EXISTS "public"."sync_config" (
    "id" bigserial PRIMARY KEY,
    "config_key" text NOT NULL UNIQUE,
    "config_value" text,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Insert initial sync configuration
INSERT INTO
    "public"."sync_config" (config_key, config_value, description)
VALUES
    (
        'first_sale_id',
        NULL,
        'First sale ID imported during historical sync'
    ),
    (
        'first_listing_id',
        NULL,
        'First listing ID imported during historical sync'
    ),
    (
        'last_sale_id_synced',
        NULL,
        'Last sale ID processed in live sync'
    ),
    (
        'last_listing_id_synced',
        NULL,
        'Last listing ID processed in live sync'
    ),
    (
        'sync_batch_size',
        '100',
        'Default batch size for processing records'
    ),
    (
        'api_rate_limit_delay',
        '3000',
        'Delay between API calls in milliseconds'
    ),
    (
        'max_retries',
        '5',
        'Maximum retries for failed API calls'
    )
ON CONFLICT (config_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_sync_config_key" ON "public"."sync_config" ("config_key");

-- Add columns to players table to track sync status
ALTER TABLE "public"."players"
ADD COLUMN IF NOT EXISTS "basic_data_synced_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "market_value_calculated_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "sync_stage" text DEFAULT 'pending' CHECK (
    sync_stage IN (
        'pending',
        'basic_imported',
        'market_calculated',
        'completed'
    )
);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS "idx_players_basic_synced" ON "public"."players" ("basic_data_synced_at");

CREATE INDEX IF NOT EXISTS "idx_players_market_calculated" ON "public"."players" ("market_value_calculated_at");

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column () RETURNS TRIGGER
set
    search_path = '' AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_config_updated_at BEFORE
UPDATE ON "public"."sync_config" FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Permissions
GRANT ALL ON TABLE "public"."sync_config" TO "anon";

GRANT ALL ON TABLE "public"."sync_config" TO "authenticated";

GRANT ALL ON TABLE "public"."sync_config" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."sync_config_id_seq" TO "service_role";

-- Upstash workflow status tracking
CREATE TABLE IF NOT EXISTS "public"."upstash_workflow_executions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "workflow_run_id" text UNIQUE NOT NULL,
    "workflow_name" text NOT NULL,
    "status" text NOT NULL DEFAULT 'running' CHECK (
        status IN ('running', 'completed', 'failed', 'cancelled')
    ),
    "started_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone,
    "error_message" text,
    "progress" jsonb DEFAULT '{}',
    "total_steps" integer DEFAULT 0,
    "completed_steps" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Indexes for Upstash workflow executions
CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_status" ON "public"."upstash_workflow_executions" ("status");

CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_workflow_name" ON "public"."upstash_workflow_executions" ("workflow_name");

CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_started_at" ON "public"."upstash_workflow_executions" ("started_at" DESC);

-- Update trigger for Upstash workflow executions
CREATE TRIGGER update_upstash_workflow_executions_updated_at BEFORE
UPDATE ON "public"."upstash_workflow_executions" FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Permissions for Upstash workflow executions
GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "anon";

GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "authenticated";

GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "service_role";