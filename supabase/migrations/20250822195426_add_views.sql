create or replace view "public"."contracted_players" as
SELECT
  p.id
FROM
  players p
WHERE
  (p.contract_id IS NOT NULL);

create or replace view "public"."top_owners" as
SELECT
  p.owner_wallet_address,
  p.owner_name,
  (count(*))::integer AS player_count
FROM
  players p
WHERE
  (
    (p.owner_wallet_address IS NOT NULL)
    AND (
      p.owner_wallet_address <> '0xff8d2bbed8164db0'::text
    )
    AND (
      p.owner_wallet_address <> '0x6fec8986261ecf49'::text
    )
  )
GROUP BY
  p.owner_wallet_address,
  p.owner_name;
