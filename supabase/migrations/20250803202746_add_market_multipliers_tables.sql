create sequence "public"."market_multiplier_updates_id_seq";

create sequence "public"."market_multipliers_id_seq";

create table "public"."market_multiplier_updates" (
    "id" integer not null default nextval('market_multiplier_updates_id_seq'::regclass),
    "update_run_id" uuid not null default gen_random_uuid(),
    "total_combinations_analyzed" integer not null,
    "combinations_updated" integer not null,
    "combinations_added" integer not null,
    "sales_data_window_days" integer not null,
    "total_sales_analyzed" integer not null,
    "started_at" timestamp with time zone not null,
    "completed_at" timestamp with time zone default now(),
    "status" character varying(20) default 'completed'::character varying
);


alter table "public"."market_multiplier_updates" enable row level security;

create table "public"."market_multipliers" (
    "id" integer not null default nextval('market_multipliers_id_seq'::regclass),
    "position" character varying(10) not null,
    "age_range" character varying(10) not null,
    "overall_range" character varying(10) not null,
    "multiplier" numeric(8,4) not null,
    "sample_size" integer not null,
    "avg_price" numeric(10,2) not null,
    "confidence_score" numeric(3,2) not null,
    "last_updated" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."market_multipliers" enable row level security;

alter sequence "public"."market_multiplier_updates_id_seq" owned by "public"."market_multiplier_updates"."id";

alter sequence "public"."market_multipliers_id_seq" owned by "public"."market_multipliers"."id";

CREATE INDEX idx_market_multipliers_lookup ON public.market_multipliers USING btree ("position", age_range, overall_range);

CREATE INDEX idx_market_multipliers_updated ON public.market_multipliers USING btree (last_updated);

CREATE UNIQUE INDEX market_multiplier_updates_pkey ON public.market_multiplier_updates USING btree (id);

CREATE UNIQUE INDEX market_multipliers_pkey ON public.market_multipliers USING btree (id);

CREATE UNIQUE INDEX market_multipliers_position_age_range_overall_range_key ON public.market_multipliers USING btree ("position", age_range, overall_range);

alter table "public"."market_multiplier_updates" add constraint "market_multiplier_updates_pkey" PRIMARY KEY using index "market_multiplier_updates_pkey";

alter table "public"."market_multipliers" add constraint "market_multipliers_pkey" PRIMARY KEY using index "market_multipliers_pkey";

alter table "public"."market_multipliers" add constraint "market_multipliers_position_age_range_overall_range_key" UNIQUE using index "market_multipliers_position_age_range_overall_range_key";

grant delete on table "public"."market_multiplier_updates" to "anon";

grant insert on table "public"."market_multiplier_updates" to "anon";

grant references on table "public"."market_multiplier_updates" to "anon";

grant select on table "public"."market_multiplier_updates" to "anon";

grant trigger on table "public"."market_multiplier_updates" to "anon";

grant truncate on table "public"."market_multiplier_updates" to "anon";

grant update on table "public"."market_multiplier_updates" to "anon";

grant delete on table "public"."market_multiplier_updates" to "authenticated";

grant insert on table "public"."market_multiplier_updates" to "authenticated";

grant references on table "public"."market_multiplier_updates" to "authenticated";

grant select on table "public"."market_multiplier_updates" to "authenticated";

grant trigger on table "public"."market_multiplier_updates" to "authenticated";

grant truncate on table "public"."market_multiplier_updates" to "authenticated";

grant update on table "public"."market_multiplier_updates" to "authenticated";

grant delete on table "public"."market_multiplier_updates" to "service_role";

grant insert on table "public"."market_multiplier_updates" to "service_role";

grant references on table "public"."market_multiplier_updates" to "service_role";

grant select on table "public"."market_multiplier_updates" to "service_role";

grant trigger on table "public"."market_multiplier_updates" to "service_role";

grant truncate on table "public"."market_multiplier_updates" to "service_role";

grant update on table "public"."market_multiplier_updates" to "service_role";

grant delete on table "public"."market_multipliers" to "anon";

grant insert on table "public"."market_multipliers" to "anon";

grant references on table "public"."market_multipliers" to "anon";

grant select on table "public"."market_multipliers" to "anon";

grant trigger on table "public"."market_multipliers" to "anon";

grant truncate on table "public"."market_multipliers" to "anon";

grant update on table "public"."market_multipliers" to "anon";

grant delete on table "public"."market_multipliers" to "authenticated";

grant insert on table "public"."market_multipliers" to "authenticated";

grant references on table "public"."market_multipliers" to "authenticated";

grant select on table "public"."market_multipliers" to "authenticated";

grant trigger on table "public"."market_multipliers" to "authenticated";

grant truncate on table "public"."market_multipliers" to "authenticated";

grant update on table "public"."market_multipliers" to "authenticated";

grant delete on table "public"."market_multipliers" to "service_role";

grant insert on table "public"."market_multipliers" to "service_role";

grant references on table "public"."market_multipliers" to "service_role";

grant select on table "public"."market_multipliers" to "service_role";

grant trigger on table "public"."market_multipliers" to "service_role";

grant truncate on table "public"."market_multipliers" to "service_role";

grant update on table "public"."market_multipliers" to "service_role";


