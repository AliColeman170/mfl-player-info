-- Sync configuration for tracking IDs and settings
CREATE TABLE IF NOT EXISTS "public"."sync_config" (
    "id" bigserial PRIMARY KEY,
    "config_key" text NOT NULL UNIQUE,
    "config_value" text,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."sync_config" ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_sync_config_key" ON "public"."sync_config" ("config_key");

-- Add columns to players table to track sync status
ALTER TABLE "public"."players"
ADD COLUMN IF NOT EXISTS "basic_data_synced_at" timestamp with time zone,
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

CREATE TRIGGER update_sync_config_updated_at BEFORE
UPDATE ON "public"."sync_config" FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column ();

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

ALTER TABLE "public"."upstash_workflow_executions" ENABLE ROW LEVEL SECURITY;

-- Indexes for Upstash workflow executions
CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_status" ON "public"."upstash_workflow_executions" ("status");

CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_workflow_name" ON "public"."upstash_workflow_executions" ("workflow_name");

CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_executions_started_at" ON "public"."upstash_workflow_executions" ("started_at" DESC);

-- Update trigger for Upstash workflow executions
CREATE TRIGGER update_upstash_workflow_executions_updated_at BEFORE
UPDATE ON "public"."upstash_workflow_executions" FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column ();

-- Permissions for Upstash workflow executions
GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "anon";

GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "authenticated";

GRANT ALL ON TABLE "public"."upstash_workflow_executions" TO "service_role";

-- Sales summary table for fast market value calculations
CREATE TABLE IF NOT EXISTS "public"."sales_summary" (
    "id" SERIAL PRIMARY KEY,
    "position" VARCHAR(10) NOT NULL,
    "age_center" INTEGER NOT NULL,
    "overall_center" INTEGER NOT NULL,
    "age_range" INTEGER NOT NULL DEFAULT 3, -- ±3 years
    "overall_range" INTEGER NOT NULL DEFAULT 3, -- ±3 overall
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "avg_price" NUMERIC(10, 2),
    "median_price" NUMERIC(10, 2),
    "recent_sales_data" JSONB, -- For EMA calculations
    "price_trend" NUMERIC(5, 4), -- Price change trend
    "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Composite unique constraint
    UNIQUE (
        "position",
        "age_center",
        "overall_center",
        "age_range",
        "overall_range"
    )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_sales_summary_lookup" ON "public"."sales_summary" ("position", "age_center", "overall_center");

-- Permissions for Upstash workflow executions
GRANT ALL ON TABLE "public"."sales_summary" TO "anon";

GRANT ALL ON TABLE "public"."sales_summary" TO "authenticated";

GRANT ALL ON TABLE "public"."sales_summary" TO "service_role";

ALTER TABLE "public"."sales_summary" ENABLE ROW LEVEL SECURITY;