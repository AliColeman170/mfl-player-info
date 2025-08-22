drop view if exists "public"."contracted_players";

drop view if exists "public"."top_owners";

set
  check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_materialized_views () RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path TO '' AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW public.top_owners;
  REFRESH MATERIALIZED VIEW public.contracted_players;
END;
$function$;

create materialized view "public"."contracted_players" as
SELECT
  p.id
FROM
  players p
WHERE
  (p.contract_id IS NOT NULL);

create materialized view "public"."top_owners" as
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
