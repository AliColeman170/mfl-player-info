set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_top_owners(limit_count integer DEFAULT 5)
 RETURNS TABLE(owner_wallet_address text, owner_name text, player_count integer, total_value integer, avg_overall integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.owner_wallet_address::TEXT,
    p.owner_name::TEXT,
    COUNT(*)::INTEGER as player_count,
    COALESCE(SUM(p.market_value_estimate), 0)::INTEGER as total_value,
    ROUND(AVG(p.overall), 0)::INTEGER as avg_overall
  FROM public.players p
  WHERE 
    p.owner_wallet_address IS NOT NULL
    AND p.market_value_estimate IS NOT NULL
    AND p.overall IS NOT NULL
    AND p.owner_wallet_address != '0xff8d2bbed8164db0'
    AND p.owner_wallet_address != '0x6fec8986261ecf49'
  GROUP BY p.owner_wallet_address, p.owner_name
  ORDER BY player_count DESC
  LIMIT limit_count;
END;
$function$
;


