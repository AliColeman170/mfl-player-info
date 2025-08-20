alter table "public"."players" add column "position_index" integer;

CREATE INDEX idx_players_position_index ON public.players USING btree (position_index);


