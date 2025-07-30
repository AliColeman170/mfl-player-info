create sequence "public"."sync_config_id_seq";

create sequence "public"."sync_executions_id_seq";

create sequence "public"."sync_stages_id_seq";

create table "public"."sync_config" (
    "id" bigint not null default nextval('sync_config_id_seq'::regclass),
    "config_key" text not null,
    "config_value" text,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."sync_executions" (
    "id" bigint not null default nextval('sync_executions_id_seq'::regclass),
    "stage_name" text not null,
    "execution_type" text not null,
    "status" text not null default 'running'::text,
    "started_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "duration_ms" bigint,
    "records_processed" integer default 0,
    "records_failed" integer default 0,
    "progress_data" jsonb default '{}'::jsonb,
    "error_message" text,
    "triggered_by" text
);


create table "public"."sync_stages" (
    "id" bigint not null default nextval('sync_stages_id_seq'::regclass),
    "stage_name" text not null,
    "stage_order" integer not null,
    "description" text,
    "is_one_time" boolean default false,
    "last_run_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "status" text default 'pending'::text,
    "progress" jsonb default '{}'::jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."players" add column "basic_data_synced_at" timestamp with time zone;

alter table "public"."players" add column "market_value_calculated_at" timestamp with time zone;

alter table "public"."players" add column "sync_stage" text default 'pending'::text;

alter sequence "public"."sync_config_id_seq" owned by "public"."sync_config"."id";

alter sequence "public"."sync_executions_id_seq" owned by "public"."sync_executions"."id";

alter sequence "public"."sync_stages_id_seq" owned by "public"."sync_stages"."id";

CREATE INDEX idx_players_basic_synced ON public.players USING btree (basic_data_synced_at);

CREATE INDEX idx_players_market_calculated ON public.players USING btree (market_value_calculated_at);

CREATE INDEX idx_players_sync_stage ON public.players USING btree (sync_stage);

CREATE INDEX idx_sync_config_key ON public.sync_config USING btree (config_key);

CREATE INDEX idx_sync_executions_stage ON public.sync_executions USING btree (stage_name, started_at);

CREATE INDEX idx_sync_executions_status ON public.sync_executions USING btree (status);

CREATE INDEX idx_sync_stages_order ON public.sync_stages USING btree (stage_order);

CREATE INDEX idx_sync_stages_status ON public.sync_stages USING btree (status);

CREATE UNIQUE INDEX sync_config_config_key_key ON public.sync_config USING btree (config_key);

CREATE UNIQUE INDEX sync_config_pkey ON public.sync_config USING btree (id);

CREATE UNIQUE INDEX sync_executions_pkey ON public.sync_executions USING btree (id);

CREATE UNIQUE INDEX sync_stages_pkey ON public.sync_stages USING btree (id);

CREATE UNIQUE INDEX sync_stages_stage_name_key ON public.sync_stages USING btree (stage_name);

alter table "public"."sync_config" add constraint "sync_config_pkey" PRIMARY KEY using index "sync_config_pkey";

alter table "public"."sync_executions" add constraint "sync_executions_pkey" PRIMARY KEY using index "sync_executions_pkey";

alter table "public"."sync_stages" add constraint "sync_stages_pkey" PRIMARY KEY using index "sync_stages_pkey";

alter table "public"."players" add constraint "players_sync_stage_check" CHECK ((sync_stage = ANY (ARRAY['pending'::text, 'basic_imported'::text, 'market_calculated'::text, 'completed'::text]))) not valid;

alter table "public"."players" validate constraint "players_sync_stage_check";

alter table "public"."sync_config" add constraint "sync_config_config_key_key" UNIQUE using index "sync_config_config_key_key";

alter table "public"."sync_executions" add constraint "sync_executions_execution_type_check" CHECK ((execution_type = ANY (ARRAY['manual'::text, 'cron'::text, 'api'::text]))) not valid;

alter table "public"."sync_executions" validate constraint "sync_executions_execution_type_check";

alter table "public"."sync_executions" add constraint "sync_executions_status_check" CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."sync_executions" validate constraint "sync_executions_status_check";

alter table "public"."sync_stages" add constraint "sync_stages_stage_name_key" UNIQUE using index "sync_stages_stage_name_key";

alter table "public"."sync_stages" add constraint "sync_stages_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."sync_stages" validate constraint "sync_stages_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_sync_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."sync_config" to "anon";

grant insert on table "public"."sync_config" to "anon";

grant references on table "public"."sync_config" to "anon";

grant select on table "public"."sync_config" to "anon";

grant trigger on table "public"."sync_config" to "anon";

grant truncate on table "public"."sync_config" to "anon";

grant update on table "public"."sync_config" to "anon";

grant delete on table "public"."sync_config" to "authenticated";

grant insert on table "public"."sync_config" to "authenticated";

grant references on table "public"."sync_config" to "authenticated";

grant select on table "public"."sync_config" to "authenticated";

grant trigger on table "public"."sync_config" to "authenticated";

grant truncate on table "public"."sync_config" to "authenticated";

grant update on table "public"."sync_config" to "authenticated";

grant delete on table "public"."sync_config" to "service_role";

grant insert on table "public"."sync_config" to "service_role";

grant references on table "public"."sync_config" to "service_role";

grant select on table "public"."sync_config" to "service_role";

grant trigger on table "public"."sync_config" to "service_role";

grant truncate on table "public"."sync_config" to "service_role";

grant update on table "public"."sync_config" to "service_role";

grant delete on table "public"."sync_executions" to "anon";

grant insert on table "public"."sync_executions" to "anon";

grant references on table "public"."sync_executions" to "anon";

grant select on table "public"."sync_executions" to "anon";

grant trigger on table "public"."sync_executions" to "anon";

grant truncate on table "public"."sync_executions" to "anon";

grant update on table "public"."sync_executions" to "anon";

grant delete on table "public"."sync_executions" to "authenticated";

grant insert on table "public"."sync_executions" to "authenticated";

grant references on table "public"."sync_executions" to "authenticated";

grant select on table "public"."sync_executions" to "authenticated";

grant trigger on table "public"."sync_executions" to "authenticated";

grant truncate on table "public"."sync_executions" to "authenticated";

grant update on table "public"."sync_executions" to "authenticated";

grant delete on table "public"."sync_executions" to "service_role";

grant insert on table "public"."sync_executions" to "service_role";

grant references on table "public"."sync_executions" to "service_role";

grant select on table "public"."sync_executions" to "service_role";

grant trigger on table "public"."sync_executions" to "service_role";

grant truncate on table "public"."sync_executions" to "service_role";

grant update on table "public"."sync_executions" to "service_role";

grant delete on table "public"."sync_stages" to "anon";

grant insert on table "public"."sync_stages" to "anon";

grant references on table "public"."sync_stages" to "anon";

grant select on table "public"."sync_stages" to "anon";

grant trigger on table "public"."sync_stages" to "anon";

grant truncate on table "public"."sync_stages" to "anon";

grant update on table "public"."sync_stages" to "anon";

grant delete on table "public"."sync_stages" to "authenticated";

grant insert on table "public"."sync_stages" to "authenticated";

grant references on table "public"."sync_stages" to "authenticated";

grant select on table "public"."sync_stages" to "authenticated";

grant trigger on table "public"."sync_stages" to "authenticated";

grant truncate on table "public"."sync_stages" to "authenticated";

grant update on table "public"."sync_stages" to "authenticated";

grant delete on table "public"."sync_stages" to "service_role";

grant insert on table "public"."sync_stages" to "service_role";

grant references on table "public"."sync_stages" to "service_role";

grant select on table "public"."sync_stages" to "service_role";

grant trigger on table "public"."sync_stages" to "service_role";

grant truncate on table "public"."sync_stages" to "service_role";

grant update on table "public"."sync_stages" to "service_role";

CREATE TRIGGER update_sync_config_updated_at BEFORE UPDATE ON public.sync_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_stages_updated_at BEFORE UPDATE ON public.sync_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


