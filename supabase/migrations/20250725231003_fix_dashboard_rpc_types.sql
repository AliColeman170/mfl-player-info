drop function if exists "public"."get_favorite_players"(limit_count integer);

drop function if exists "public"."get_top_owners"(limit_count integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_favorite_players(limit_count integer DEFAULT 5)
 RETURNS TABLE(id integer, first_name text, last_name text, overall integer, primary_position text, market_value_estimate integer, age integer, club_name text, favorite_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.overall,
    p.primary_position::TEXT,
    p.market_value_estimate,
    p.age,
    p.club_name::TEXT,
    COUNT(f.player_id)::INTEGER as favorite_count
  FROM public.players p
  INNER JOIN public.favourites f ON p.id = f.player_id
  WHERE f.is_favourite = true
  GROUP BY p.id, p.first_name, p.last_name, p.overall, p.primary_position, p.market_value_estimate, p.age, p.club_name
  ORDER BY favorite_count DESC
  LIMIT limit_count;
END;
$function$
;

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
  GROUP BY p.owner_wallet_address, p.owner_name
  ORDER BY player_count DESC
  LIMIT limit_count;
END;
$function$
;


