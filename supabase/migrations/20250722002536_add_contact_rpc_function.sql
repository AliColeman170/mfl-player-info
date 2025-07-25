set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_contract_stats_for_player(player_id integer, age_min integer DEFAULT NULL::integer, age_max integer DEFAULT NULL::integer, overall_min integer DEFAULT NULL::integer, overall_max integer DEFAULT NULL::integer, position_filter text DEFAULT NULL::text)
 RETURNS TABLE(division integer, total_contracts bigint, min_revenue_share integer, max_revenue_share integer, avg_revenue_share numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  target_age INTEGER;
  target_overall INTEGER;
  target_position TEXT;
BEGIN
  -- Get the target player's stats
  SELECT age, overall, primary_position 
  INTO target_age, target_overall, target_position
  FROM players 
  WHERE id = player_id;
  
  -- Use provided parameters or calculate ranges based on target player
  age_min := COALESCE(age_min, GREATEST(16, target_age - 1));
  age_max := COALESCE(age_max, LEAST(40, target_age + 1));
  overall_min := COALESCE(overall_min, GREATEST(0, target_overall - 2));
  overall_max := COALESCE(overall_max, LEAST(99, target_overall + 2));
  position_filter := COALESCE(position_filter, target_position);
  
  RETURN QUERY
  SELECT 
    p.club_division as division,
    COUNT(*) as total_contracts,
    MIN(p.revenue_share) as min_revenue_share,
    MAX(p.revenue_share) as max_revenue_share,
    ROUND(AVG(p.revenue_share), 2) as avg_revenue_share
  FROM players p
  WHERE 
    p.revenue_share IS NOT NULL 
    AND p.revenue_share > 0
    AND p.club_division IS NOT NULL
    AND p.age BETWEEN age_min AND age_max
    AND p.overall BETWEEN overall_min AND overall_max
    AND (position_filter IS NULL OR p.primary_position = position_filter)
    AND p.contract_status = 'ACTIVE'
  GROUP BY p.club_division
  HAVING COUNT(*) > 0
  ORDER BY p.club_division;
END;
$function$
;


