-- Player sync tables for storing computed player data
CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" bigint NOT NULL,
    -- Basic player info
    "first_name" "text",
    "last_name" "text",
    "age" integer,
    "height" integer,
    "nationality" "text",
    "primary_position" "text",
    "secondary_positions" "text" [],
    "preferred_foot" "text",
    "is_retired" boolean DEFAULT false,
    -- Player stats
    "overall" integer,
    "pace" integer,
    "shooting" integer,
    "passing" integer,
    "dribbling" integer,
    "defense" integer,
    "physical" integer,
    "goalkeeping" integer,
    "resistance" integer,
    -- Contract information
    "has_pre_contract" boolean,
    "energy" integer,
    "offer_status" integer,
    "offer_min_division" integer,
    "offer_min_revenue_share" integer,
    "offer_auto_accept" boolean,
    -- Active contract data
    "contract_id" bigint,
    "contract_status" "text",
    "contract_kind" "text",
    "revenue_share" integer,
    "total_revenue_share_locked" integer,
    "start_season" integer,
    "nb_seasons" integer,
    "auto_renewal" boolean,
    "contract_created_date_time" bigint,
    "clauses" "jsonb",
    -- Club information
    "club_id" bigint,
    "club_name" "text",
    "club_name_lower" "text" GENERATED ALWAYS AS (lower(trim(club_name))) STORED,
    "club_main_color" "text",
    "club_secondary_color" "text",
    "club_city" "text",
    "club_division" integer,
    "club_logo_version" "text",
    "club_country" "text",
    "club_type" "text",
    -- Owner information
    "owner_wallet_address" "text",
    "owner_name" "text",
    "owner_name_lower" "text" GENERATED ALWAYS AS (lower(trim(owner_name))) STORED,
    "owner_twitter" "text",
    "owner_last_active" bigint,
    -- Burned status
    "is_burned" boolean GENERATED ALWAYS AS (
        CASE
            WHEN "owner_wallet_address" = '0x6fec8986261ecf49' THEN true
            ELSE false
        END
    ) STORED,
    -- Market/listing data
    "current_listing_id" bigint,
    "current_listing_price" integer,
    "current_listing_status" "text",
    "listing_created_date_time" bigint,
    "last_sale_price" integer,
    "last_sale_date" bigint,
    -- Computed fields
    "best_position" "text",
    "best_ovr" integer,
    "ovr_difference" integer,
    "position_index" integer,
    "best_position_index" integer,
    "price_difference" integer,
    "market_value_estimate" integer,
    "market_value_low" integer,
    "market_value_high" integer,
    "market_value_confidence" "text",
    "market_value_method" "text",
    "market_value_sample_size" integer,
    "market_value_based_on" "text",
    "market_value_updated_at" timestamp with time zone,
    "base_value_estimate" integer,
    "position_ratings" "jsonb",
    "best_position_rating" integer,
    "best_position_difference" integer,
    -- Search optimization
    "search_text" "text" GENERATED ALWAYS AS (
        lower(
            trim(
                id::text || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, '')
            )
        )
    ) STORED,
    -- Sync metadata
    "last_synced_at" timestamp with time zone DEFAULT "now" (),
    "created_at" timestamp with time zone DEFAULT "now" (),
    "updated_at" timestamp with time zone DEFAULT "now" (),
    "sync_version" integer DEFAULT 1,
    "data_hash" "text"
);

ALTER TABLE "public"."players" OWNER TO "postgres";

-- Sales table to store all marketplace sales data
CREATE TABLE IF NOT EXISTS "public"."sales" (
    "listing_resource_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "price" integer NOT NULL,
    "seller_wallet_address" "text",
    "buyer_wallet_address" "text",
    "created_date_time" bigint NOT NULL,
    "purchase_date_time" bigint,
    "status" "text" DEFAULT 'BOUGHT',
    -- Player metadata at time of sale (for fast filtering without joins)
    "player_age" integer,
    "player_overall" integer,
    "player_position" "text",
    -- Timestamps
    "imported_at" timestamp with time zone DEFAULT "now" (),
    "updated_at" timestamp with time zone DEFAULT "now" (),
    -- Constraints
    CONSTRAINT "sales_price_positive" CHECK ("price" > 0)
);

ALTER TABLE "public"."sales" OWNER TO "postgres";

-- Primary key constraints
ALTER TABLE ONLY "public"."players"
ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."sales"
ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("listing_resource_id");

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_players_overall" ON "public"."players" USING "btree" ("overall");

CREATE INDEX IF NOT EXISTS "idx_players_best_ovr" ON "public"."players" USING "btree" ("best_ovr");

CREATE INDEX IF NOT EXISTS "idx_players_market_value" ON "public"."players" USING "btree" ("market_value_estimate");

CREATE INDEX IF NOT EXISTS "idx_players_best_position_rating" ON "public"."players" USING "btree" ("best_position_rating");

CREATE INDEX IF NOT EXISTS "idx_players_age" ON "public"."players" USING "btree" ("age");

CREATE INDEX IF NOT EXISTS "idx_players_name" ON "public"."players" USING "btree" ("last_name", "first_name");

CREATE INDEX IF NOT EXISTS "idx_players_primary_position" ON "public"."players" USING "btree" ("primary_position");

CREATE INDEX IF NOT EXISTS "idx_players_position_index" ON "public"."players" USING "btree" ("position_index");

CREATE INDEX IF NOT EXISTS "idx_players_best_position_index" ON "public"."players" USING "btree" ("best_position_index");

CREATE INDEX IF NOT EXISTS "idx_players_secondary_positions" ON "public"."players" USING "gin" ("secondary_positions");

CREATE INDEX IF NOT EXISTS "idx_players_nationality" ON "public"."players" USING "btree" ("nationality");

CREATE INDEX IF NOT EXISTS "idx_players_composite_search" ON "public"."players" USING "btree" (
    "age",
    "overall",
    "best_ovr",
    "market_value_estimate"
);

CREATE INDEX IF NOT EXISTS "idx_players_market_value_updated" ON "public"."players" USING "btree" ("market_value_updated_at");

CREATE INDEX IF NOT EXISTS "idx_players_last_synced" ON "public"."players" USING "btree" ("last_synced_at");

-- Additional indexes for new fields
CREATE INDEX IF NOT EXISTS "idx_players_owner_wallet" ON "public"."players" USING "btree" ("owner_wallet_address");

CREATE INDEX IF NOT EXISTS "idx_players_owner_name_lower" ON "public"."players" USING "btree" ("owner_name_lower");

CREATE INDEX IF NOT EXISTS "idx_players_club_id" ON "public"."players" USING "btree" ("club_id");

CREATE INDEX IF NOT EXISTS "idx_players_club_name_lower" ON "public"."players" USING "btree" ("club_name_lower");

CREATE INDEX IF NOT EXISTS "idx_players_club_division" ON "public"."players" USING "btree" ("club_division");

CREATE INDEX IF NOT EXISTS "idx_players_contract_status" ON "public"."players" USING "btree" ("contract_status");

CREATE INDEX IF NOT EXISTS "idx_players_listing_status" ON "public"."players" USING "btree" ("current_listing_status");

CREATE INDEX IF NOT EXISTS "idx_players_listing_price" ON "public"."players" USING "btree" ("current_listing_price");

CREATE INDEX IF NOT EXISTS "idx_players_energy" ON "public"."players" USING "btree" ("energy");

CREATE INDEX IF NOT EXISTS "idx_players_offer_status" ON "public"."players" USING "btree" ("offer_status");

CREATE INDEX IF NOT EXISTS "idx_players_goalkeeping" ON "public"."players" USING "btree" ("goalkeeping");

CREATE INDEX IF NOT EXISTS "idx_players_resistance" ON "public"."players" USING "btree" ("resistance");

CREATE INDEX IF NOT EXISTS "idx_players_data_hash" ON "public"."players" USING "btree" ("data_hash");

CREATE INDEX IF NOT EXISTS "idx_players_is_retired" ON "public"."players" USING "btree" ("is_retired");

CREATE INDEX IF NOT EXISTS "idx_players_is_burned" ON "public"."players" USING "btree" ("is_burned");

-- Sales table indexes for fast market value calculations
CREATE INDEX IF NOT EXISTS "idx_sales_player_id" ON "public"."sales" USING "btree" ("player_id");

CREATE INDEX IF NOT EXISTS "idx_sales_created_date_time" ON "public"."sales" USING "btree" ("created_date_time" DESC);

CREATE INDEX IF NOT EXISTS "idx_sales_purchase_date_time" ON "public"."sales" USING "btree" ("purchase_date_time" DESC);

CREATE INDEX IF NOT EXISTS "idx_sales_listing_resource_id" ON "public"."sales" USING "btree" ("listing_resource_id");

-- Composite indexes for market value filtering
CREATE INDEX IF NOT EXISTS "idx_sales_age_overall_position" ON "public"."sales" USING "btree" ("player_age", "player_overall", "player_position");

CREATE INDEX IF NOT EXISTS "idx_sales_overall_age" ON "public"."sales" USING "btree" ("player_overall", "player_age");

CREATE INDEX IF NOT EXISTS "idx_sales_position_overall" ON "public"."sales" USING "btree" ("player_position", "player_overall");

CREATE INDEX IF NOT EXISTS "idx_sales_imported_at" ON "public"."sales" USING "btree" ("imported_at");

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column" () RETURNS "trigger" LANGUAGE "plpgsql"
set
    search_path = '' AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "update_players_updated_at" BEFORE
UPDATE ON "public"."players" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

CREATE TRIGGER "update_sales_updated_at" BEFORE
UPDATE ON "public"."sales" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- Permissions
GRANT ALL ON TABLE "public"."players" TO "anon";

GRANT ALL ON TABLE "public"."players" TO "authenticated";

GRANT ALL ON TABLE "public"."players" TO "service_role";

GRANT ALL ON TABLE "public"."sales" TO "anon";

GRANT ALL ON TABLE "public"."sales" TO "authenticated";

GRANT ALL ON TABLE "public"."sales" TO "service_role";

-- Add foreign key constraints
ALTER TABLE ONLY "public"."favourites"
ADD CONSTRAINT "favourites_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players" ("id");

ALTER TABLE ONLY "public"."sales"
ADD CONSTRAINT "sales_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players" ("id");

-- Market multipliers table for dynamic market analysis
CREATE TABLE IF NOT EXISTS "public"."market_multipliers" (
    "id" SERIAL PRIMARY KEY,
    "position" VARCHAR(10) NOT NULL,
    "age_range" VARCHAR(10) NOT NULL, -- '16-22', '23-27', '28-32', '33-40'
    "overall_range" VARCHAR(10) NOT NULL, -- '85-89', '80-84', etc.
    "multiplier" DECIMAL(8, 4) NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "avg_price" DECIMAL(10, 2) NOT NULL,
    "confidence_score" DECIMAL(3, 2) NOT NULL, -- 0.0 to 1.0
    "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Composite unique constraint
    UNIQUE ("position", "age_range", "overall_range")
);

ALTER TABLE "public"."market_multipliers" OWNER TO "postgres";

-- Market multiplier update log
CREATE TABLE IF NOT EXISTS "public"."market_multiplier_updates" (
    "id" SERIAL PRIMARY KEY,
    "update_run_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "total_combinations_analyzed" INTEGER NOT NULL,
    "combinations_updated" INTEGER NOT NULL,
    "combinations_added" INTEGER NOT NULL,
    "sales_data_window_days" INTEGER NOT NULL,
    "total_sales_analyzed" INTEGER NOT NULL,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "status" VARCHAR(20) DEFAULT 'completed' -- 'running', 'completed', 'failed'
);

ALTER TABLE "public"."market_multiplier_updates" OWNER TO "postgres";

-- Indexes for market multipliers
CREATE INDEX IF NOT EXISTS "idx_market_multipliers_lookup" ON "public"."market_multipliers" ("position", "age_range", "overall_range");

CREATE INDEX IF NOT EXISTS "idx_market_multipliers_updated" ON "public"."market_multipliers" ("last_updated");

-- Enable RLS
ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."market_multipliers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."market_multiplier_updates" ENABLE ROW LEVEL SECURITY;