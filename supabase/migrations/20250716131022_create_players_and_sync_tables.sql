create sequence "public"."sync_status_id_seq";

create table "public"."players" (
    "id" bigint not null,
    "first_name" text,
    "last_name" text,
    "age" integer,
    "height" integer,
    "nationalities" jsonb,
    "positions" jsonb,
    "preferred_foot" text,
    "overall" integer,
    "pace" integer,
    "shooting" integer,
    "passing" integer,
    "dribbling" integer,
    "defense" integer,
    "physical" integer,
    "goalkeeping" integer,
    "resistance" integer,
    "has_pre_contract" boolean,
    "energy" integer,
    "offer_status" integer,
    "offer_min_division" integer,
    "offer_min_revenue_share" integer,
    "offer_auto_accept" boolean,
    "contract_id" bigint,
    "contract_status" text,
    "contract_kind" text,
    "revenue_share" integer,
    "total_revenue_share_locked" integer,
    "start_season" integer,
    "nb_seasons" integer,
    "auto_renewal" boolean,
    "contract_created_date_time" bigint,
    "clauses" jsonb,
    "club_id" bigint,
    "club_name" text,
    "club_main_color" text,
    "club_secondary_color" text,
    "club_city" text,
    "club_division" integer,
    "club_logo_version" text,
    "club_country" text,
    "club_type" text,
    "owner_wallet_address" text,
    "owner_name" text,
    "owner_twitter" text,
    "owner_last_active" bigint,
    "current_listing_id" bigint,
    "current_listing_price" integer,
    "current_listing_status" text,
    "listing_created_date_time" bigint,
    "last_sale_price" integer,
    "last_sale_date" bigint,
    "best_position" text,
    "best_ovr" integer,
    "ovr_difference" integer,
    "market_value_estimate" integer,
    "market_value_low" integer,
    "market_value_high" integer,
    "market_value_confidence" text,
    "market_value_method" text,
    "market_value_sample_size" integer,
    "market_value_updated_at" timestamp with time zone,
    "position_ratings" jsonb,
    "best_position_rating" integer,
    "best_position_difference" integer,
    "captain_best_position" text,
    "captain_best_rating" integer,
    "captain_best_difference" integer,
    "last_synced_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "sync_version" integer default 1,
    "data_hash" text
);


alter table "public"."players" enable row level security;

create table "public"."sync_status" (
    "id" bigint not null default nextval('sync_status_id_seq'::regclass),
    "sync_type" text not null,
    "status" text not null,
    "total_players" integer,
    "synced_players" integer default 0,
    "failed_players" integer default 0,
    "started_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."sync_status" enable row level security;

alter sequence "public"."sync_status_id_seq" owned by "public"."sync_status"."id";

CREATE INDEX idx_players_age ON public.players USING btree (age);

CREATE INDEX idx_players_best_ovr ON public.players USING btree (best_ovr);

CREATE INDEX idx_players_best_position_rating ON public.players USING btree (best_position_rating);

CREATE INDEX idx_players_club_division ON public.players USING btree (club_division);

CREATE INDEX idx_players_club_id ON public.players USING btree (club_id);

CREATE INDEX idx_players_composite_search ON public.players USING btree (age, overall, best_ovr, market_value_estimate);

CREATE INDEX idx_players_contract_status ON public.players USING btree (contract_status);

CREATE INDEX idx_players_data_hash ON public.players USING btree (data_hash);

CREATE INDEX idx_players_energy ON public.players USING btree (energy);

CREATE INDEX idx_players_goalkeeping ON public.players USING btree (goalkeeping);

CREATE INDEX idx_players_last_synced ON public.players USING btree (last_synced_at);

CREATE INDEX idx_players_listing_price ON public.players USING btree (current_listing_price);

CREATE INDEX idx_players_listing_status ON public.players USING btree (current_listing_status);

CREATE INDEX idx_players_market_value ON public.players USING btree (market_value_estimate);

CREATE INDEX idx_players_market_value_updated ON public.players USING btree (market_value_updated_at);

CREATE INDEX idx_players_name ON public.players USING btree (last_name, first_name);

CREATE INDEX idx_players_nationalities ON public.players USING gin (nationalities);

CREATE INDEX idx_players_offer_status ON public.players USING btree (offer_status);

CREATE INDEX idx_players_overall ON public.players USING btree (overall);

CREATE INDEX idx_players_owner_wallet ON public.players USING btree (owner_wallet_address);

CREATE INDEX idx_players_positions ON public.players USING gin (positions);

CREATE INDEX idx_players_resistance ON public.players USING btree (resistance);

CREATE INDEX idx_sync_status_started_at ON public.sync_status USING btree (started_at);

CREATE INDEX idx_sync_status_type ON public.sync_status USING btree (status, sync_type);

CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

CREATE UNIQUE INDEX sync_status_pkey ON public.sync_status USING btree (id);

alter table "public"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "public"."sync_status" add constraint "sync_status_pkey" PRIMARY KEY using index "sync_status_pkey";

alter table "public"."sync_status" add constraint "sync_status_status_check" CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."sync_status" validate constraint "sync_status_status_check";

alter table "public"."sync_status" add constraint "sync_status_sync_type_check" CHECK ((sync_type = ANY (ARRAY['full'::text, 'individual'::text]))) not valid;

alter table "public"."sync_status" validate constraint "sync_status_sync_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

grant delete on table "public"."sync_status" to "anon";

grant insert on table "public"."sync_status" to "anon";

grant references on table "public"."sync_status" to "anon";

grant select on table "public"."sync_status" to "anon";

grant trigger on table "public"."sync_status" to "anon";

grant truncate on table "public"."sync_status" to "anon";

grant update on table "public"."sync_status" to "anon";

grant delete on table "public"."sync_status" to "authenticated";

grant insert on table "public"."sync_status" to "authenticated";

grant references on table "public"."sync_status" to "authenticated";

grant select on table "public"."sync_status" to "authenticated";

grant trigger on table "public"."sync_status" to "authenticated";

grant truncate on table "public"."sync_status" to "authenticated";

grant update on table "public"."sync_status" to "authenticated";

grant delete on table "public"."sync_status" to "service_role";

grant insert on table "public"."sync_status" to "service_role";

grant references on table "public"."sync_status" to "service_role";

grant select on table "public"."sync_status" to "service_role";

grant trigger on table "public"."sync_status" to "service_role";

grant truncate on table "public"."sync_status" to "service_role";

grant update on table "public"."sync_status" to "service_role";

create policy "Enable all operations for service role"
on "public"."players"
as permissive
for all
to service_role
using (true);


create policy "Enable read access for all users"
on "public"."players"
as permissive
for select
to public
using (true);


create policy "Enable all operations for service role"
on "public"."sync_status"
as permissive
for all
to service_role
using (true);


create policy "Enable read access for all users"
on "public"."sync_status"
as permissive
for select
to public
using (true);


CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


