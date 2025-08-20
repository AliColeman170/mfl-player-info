drop index if exists "public"."idx_players_nationalities";

drop index if exists "public"."idx_players_positions";

alter table "public"."players" drop column "nationalities";

alter table "public"."players" drop column "positions";

alter table "public"."players" add column "nationality" text;

alter table "public"."players" add column "primary_position" text;

alter table "public"."players" add column "secondary_positions" text[];

CREATE INDEX idx_players_nationality ON public.players USING btree (nationality);

CREATE INDEX idx_players_primary_position ON public.players USING btree (primary_position);

CREATE INDEX idx_players_secondary_positions ON public.players USING gin (secondary_positions);


