CREATE MATERIALIZED VIEW public.top_owners as
SELECT
    p.owner_wallet_address::TEXT,
    p.owner_name::TEXT,
    COUNT(*)::INTEGER as player_count
FROM
    public.players p
WHERE
    p.owner_wallet_address IS NOT NULL
    AND p.owner_wallet_address != '0xff8d2bbed8164db0'
    AND p.owner_wallet_address != '0x6fec8986261ecf49'
GROUP BY
    p.owner_wallet_address,
    p.owner_name;

CREATE MATERIALIZED VIEW public.contracted_players as
SELECT
    p.id
FROM
    public.players p
WHERE
    p.contract_id IS NOT NULL;

CREATE or REPLACE VIEW public.favourite_players as
SELECT
    p.id,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.overall,
    p.primary_position::TEXT,
    p.age,
    p.club_name::TEXT,
    COUNT(f.player_id)::INTEGER as favorite_count
FROM
    public.players p
    INNER JOIN public.favourites f ON p.id = f.player_id
WHERE
    f.is_favourite = true
GROUP BY
    p.id,
    p.first_name,
    p.last_name,
    p.overall,
    p.primary_position,
    p.age,
    p.club_name;

-- RPC function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views () RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = '' AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.top_owners;
  REFRESH MATERIALIZED VIEW public.contracted_players;
END;
$$;