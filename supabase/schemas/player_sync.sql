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

CREATE TABLE IF NOT EXISTS "public"."sync_status" (
    "id" bigint NOT NULL,
    "sync_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "total_players" integer,
    "synced_players" integer DEFAULT 0,
    "failed_players" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now" (),
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now" (),
    CONSTRAINT "sync_status_sync_type_check" CHECK (
        (
            "sync_type" = ANY (ARRAY['full'::"text", 'individual'::"text"])
        )
    ),
    CONSTRAINT "sync_status_status_check" CHECK (
        (
            "status" = ANY (
                ARRAY[
                    'running'::"text",
                    'completed'::"text",
                    'failed'::"text"
                ]
            )
        )
    )
);

ALTER TABLE "public"."sync_status" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."sync_status_id_seq" AS bigint START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER TABLE "public"."sync_status_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."sync_status_id_seq" OWNED BY "public"."sync_status"."id";

ALTER TABLE ONLY "public"."sync_status"
ALTER COLUMN "id"
SET DEFAULT "nextval" ('"public"."sync_status_id_seq"'::"regclass");

-- Primary key constraints
ALTER TABLE ONLY "public"."players"
ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."sync_status"
ADD CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id");

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

CREATE INDEX IF NOT EXISTS "idx_sync_status_type" ON "public"."sync_status" USING "btree" ("status", "sync_type");

CREATE INDEX IF NOT EXISTS "idx_sync_status_started_at" ON "public"."sync_status" USING "btree" ("started_at");

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column" () RETURNS "trigger" LANGUAGE "plpgsql" AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "update_players_updated_at" BEFORE
UPDATE ON "public"."players" FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column" ();

-- Permissions
GRANT ALL ON TABLE "public"."players" TO "anon";

GRANT ALL ON TABLE "public"."players" TO "authenticated";

GRANT ALL ON TABLE "public"."players" TO "service_role";

GRANT ALL ON TABLE "public"."sync_status" TO "anon";

GRANT ALL ON TABLE "public"."sync_status" TO "authenticated";

GRANT ALL ON TABLE "public"."sync_status" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sync_status_id_seq" TO "anon";

GRANT ALL ON SEQUENCE "public"."sync_status_id_seq" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."sync_status_id_seq" TO "service_role";

-- Add foreign key constraint for favourites
ALTER TABLE ONLY "public"."favourites"
ADD CONSTRAINT "favourites_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players" ("id");

-- Enable RLS
ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sync_status" ENABLE ROW LEVEL SECURITY;