alter table "public"."players" add column "best_position_index" integer;

CREATE INDEX idx_players_best_position_index ON public.players USING btree (best_position_index);


