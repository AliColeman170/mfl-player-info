-- Drop the existing generated columns
alter table "public"."players" drop column "club_name_lower";
alter table "public"."players" drop column "owner_name_lower";

-- Recreate with trim included
alter table "public"."players" add column "club_name_lower" text generated always as (lower(trim(club_name))) stored;
alter table "public"."players" add column "owner_name_lower" text generated always as (lower(trim(owner_name))) stored;

-- Recreate the indexes
CREATE INDEX idx_players_club_name_lower ON public.players USING btree (club_name_lower);
CREATE INDEX idx_players_owner_name_lower ON public.players USING btree (owner_name_lower);


