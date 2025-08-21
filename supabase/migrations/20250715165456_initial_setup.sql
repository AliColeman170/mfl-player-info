create table if not exists "public"."favourites" (
    "wallet_address" text not null,
    "player_id" bigint not null,
    "tags" text[] not null default '{}'::text[],
    "is_favourite" boolean not null default false
);

alter table "public"."favourites" enable row level security;

create table if not exists "public"."nonces" (
    "id" text not null,
    "expires" timestamp with time zone not null default (now() + '00:10:00'::interval)
);

alter table "public"."nonces" enable row level security;

CREATE UNIQUE INDEX if not exists favourites_pkey ON public.favourites USING btree (wallet_address, player_id);

CREATE UNIQUE INDEX if not exists nonces_pkey ON public.nonces USING btree (id);

grant delete on table "public"."favourites" to "anon";

grant insert on table "public"."favourites" to "anon";

grant references on table "public"."favourites" to "anon";

grant
select
    on table "public"."favourites" to "anon";

grant trigger on table "public"."favourites" to "anon";

grant
truncate on table "public"."favourites" to "anon";

grant
update on table "public"."favourites" to "anon";

grant delete on table "public"."favourites" to "authenticated";

grant insert on table "public"."favourites" to "authenticated";

grant references on table "public"."favourites" to "authenticated";

grant
select
    on table "public"."favourites" to "authenticated";

grant trigger on table "public"."favourites" to "authenticated";

grant
truncate on table "public"."favourites" to "authenticated";

grant
update on table "public"."favourites" to "authenticated";

grant delete on table "public"."favourites" to "service_role";

grant insert on table "public"."favourites" to "service_role";

grant references on table "public"."favourites" to "service_role";

grant
select
    on table "public"."favourites" to "service_role";

grant trigger on table "public"."favourites" to "service_role";

grant
truncate on table "public"."favourites" to "service_role";

grant
update on table "public"."favourites" to "service_role";

grant delete on table "public"."nonces" to "anon";

grant insert on table "public"."nonces" to "anon";

grant references on table "public"."nonces" to "anon";

grant
select
    on table "public"."nonces" to "anon";

grant trigger on table "public"."nonces" to "anon";

grant
truncate on table "public"."nonces" to "anon";

grant
update on table "public"."nonces" to "anon";

grant delete on table "public"."nonces" to "authenticated";

grant insert on table "public"."nonces" to "authenticated";

grant references on table "public"."nonces" to "authenticated";

grant
select
    on table "public"."nonces" to "authenticated";

grant trigger on table "public"."nonces" to "authenticated";

grant
truncate on table "public"."nonces" to "authenticated";

grant
update on table "public"."nonces" to "authenticated";

grant delete on table "public"."nonces" to "service_role";

grant insert on table "public"."nonces" to "service_role";

grant references on table "public"."nonces" to "service_role";

grant
select
    on table "public"."nonces" to "service_role";

grant trigger on table "public"."nonces" to "service_role";

grant
truncate on table "public"."nonces" to "service_role";

grant
update on table "public"."nonces" to "service_role";

drop policy if exists "Enable delete for users based on wallet address" on "public"."favourites";

create policy "Enable delete for users based on wallet address" on "public"."favourites" as permissive for delete to authenticated using (
    (
        (
            SELECT
                (
                    (auth.jwt () -> 'user_metadata'::text) ->> 'address'::text
                )
        ) = wallet_address
    )
);

drop policy if exists "Enable insert for authenticated users only" on "public"."favourites";

create policy "Enable insert for authenticated users only" on "public"."favourites" as permissive for insert to authenticated
with
    check (true);

drop policy if exists "Enable select for users based on wallet address" on "public"."favourites";

create policy "Enable select for users based on wallet address" on "public"."favourites" as permissive for
select
    to authenticated using (
        (
            (
                SELECT
                    (
                        (auth.jwt () -> 'user_metadata'::text) ->> 'address'::text
                    )
            ) = wallet_address
        )
    );

drop policy if exists "Enable update for users based on wallet address" on "public"."favourites";

create policy "Enable update for users based on wallet address" on "public"."favourites" as permissive
for update
    to authenticated using (
        (
            (
                SELECT
                    (
                        (auth.jwt () -> 'user_metadata'::text) ->> 'address'::text
                    )
            ) = wallet_address
        )
    )
with
    check (
        (
            (
                SELECT
                    (
                        (auth.jwt () -> 'user_metadata'::text) ->> 'address'::text
                    )
            ) = wallet_address
        )
    );
