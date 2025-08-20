create sequence "public"."player_sync_metadata_id_seq";

create table "public"."player_sync_metadata" (
    "id" bigint not null default nextval('player_sync_metadata_id_seq'::regclass),
    "sync_type" text not null default 'full'::text,
    "last_player_id" bigint,
    "total_fetched" integer default 0,
    "total_saved" integer default 0,
    "current_page" integer default 1,
    "status" text default 'running'::text,
    "started_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "error_message" text
);


alter table "public"."player_sync_metadata" enable row level security;

alter sequence "public"."player_sync_metadata_id_seq" owned by "public"."player_sync_metadata"."id";

CREATE INDEX idx_player_sync_metadata_started_at ON public.player_sync_metadata USING btree (started_at);

CREATE INDEX idx_player_sync_metadata_status ON public.player_sync_metadata USING btree (status);

CREATE UNIQUE INDEX player_sync_metadata_pkey ON public.player_sync_metadata USING btree (id);

alter table "public"."player_sync_metadata" add constraint "player_sync_metadata_pkey" PRIMARY KEY using index "player_sync_metadata_pkey";

grant delete on table "public"."player_sync_metadata" to "anon";

grant insert on table "public"."player_sync_metadata" to "anon";

grant references on table "public"."player_sync_metadata" to "anon";

grant select on table "public"."player_sync_metadata" to "anon";

grant trigger on table "public"."player_sync_metadata" to "anon";

grant truncate on table "public"."player_sync_metadata" to "anon";

grant update on table "public"."player_sync_metadata" to "anon";

grant delete on table "public"."player_sync_metadata" to "authenticated";

grant insert on table "public"."player_sync_metadata" to "authenticated";

grant references on table "public"."player_sync_metadata" to "authenticated";

grant select on table "public"."player_sync_metadata" to "authenticated";

grant trigger on table "public"."player_sync_metadata" to "authenticated";

grant truncate on table "public"."player_sync_metadata" to "authenticated";

grant update on table "public"."player_sync_metadata" to "authenticated";

grant delete on table "public"."player_sync_metadata" to "service_role";

grant insert on table "public"."player_sync_metadata" to "service_role";

grant references on table "public"."player_sync_metadata" to "service_role";

grant select on table "public"."player_sync_metadata" to "service_role";

grant trigger on table "public"."player_sync_metadata" to "service_role";

grant truncate on table "public"."player_sync_metadata" to "service_role";

grant update on table "public"."player_sync_metadata" to "service_role";

CREATE TRIGGER update_player_sync_metadata_updated_at BEFORE UPDATE ON public.player_sync_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


