set
  check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_top_owners (limit_count integer DEFAULT 5) RETURNS TABLE (
  owner_wallet_address text,
  owner_name text,
  player_count integer,
  total_value integer,
  avg_overall integer
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path TO '' AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.owner_wallet_address::TEXT,
    p.owner_name::TEXT,
    COUNT(*)::INTEGER as player_count
  FROM public.players p
  WHERE 
    p.owner_wallet_address IS NOT NULL
    AND p.owner_wallet_address != '0xff8d2bbed8164db0'
    AND p.owner_wallet_address != '0x6fec8986261ecf49'
  GROUP BY p.owner_wallet_address, p.owner_name
  ORDER BY player_count DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_total_sales_volume () RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path TO '' AS $function$
DECLARE
  total_volume BIGINT;
BEGIN
  SELECT COALESCE(SUM(price), 0) INTO total_volume FROM public.sales;
  RETURN total_volume;
END;
$function$;
