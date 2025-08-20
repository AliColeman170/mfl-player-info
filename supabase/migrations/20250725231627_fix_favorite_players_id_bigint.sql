drop function if exists "public"."get_favorite_players"(limit_count integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_favorite_players(limit_count integer DEFAULT 5)
 RETURNS TABLE(id bigint, first_name text, last_name text, overall integer, primary_position text, market_value_estimate integer, age integer, club_name text, favorite_count integer)
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


