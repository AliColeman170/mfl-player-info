alter table "public"."players" add column "is_burned" boolean generated always as (
CASE
    WHEN (owner_wallet_address = '0x6fec8986261ecf49'::text) THEN true
    ELSE false
END) stored;

CREATE INDEX idx_players_is_burned ON public.players USING btree (is_burned);


