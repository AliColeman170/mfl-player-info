alter table "public"."players" add column "club_name_lower" text generated always as (lower(club_name)) stored;

alter table "public"."players" add column "owner_name_lower" text generated always as (lower(owner_name)) stored;

CREATE INDEX idx_players_club_name_lower ON public.players USING btree (club_name_lower);

CREATE INDEX idx_players_owner_name_lower ON public.players USING btree (owner_name_lower);


