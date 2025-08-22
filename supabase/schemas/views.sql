CREATE or REPLACE VIEW public.top_owners as
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

CREATE or REPLACE VIEW public.contracted_players as
SELECT
    p.id
FROM
    public.players p
WHERE
    p.contract_id IS NOT NULL;