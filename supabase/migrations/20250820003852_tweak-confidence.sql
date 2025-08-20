set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 5000, offset_val integer DEFAULT 0)
 RETURNS TABLE(processed_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated INTEGER := 0;
BEGIN
  
  -- Single bulk UPDATE statement using CTE for maximum performance
  WITH batch_players AS (
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  ),
  market_values AS (
    SELECT 
      bp.id as player_id,
      -- Use the comprehensive value function directly
      public.calculate_comprehensive_player_value(bp.overall, bp.age, bp.primary_position) as estimated_value,
      -- Simple confidence and method for bulk operation
      CASE 
        WHEN bp.overall >= 90 THEN 'Low'
        WHEN bp.overall >= 85 AND bp.age <= 22 THEN 'Low'
        WHEN bp.overall >= 85 AND bp.age >= 30 THEN 'Low'
        WHEN bp.overall >= 85 THEN 'Medium'
        WHEN bp.age <= 22 THEN 'Medium' 
        WHEN bp.age >= 30 THEN 'Medium'
        ELSE 'High'
      END as confidence_level,
      'Comprehensive formula + market multipliers' as method_used
    FROM batch_players bp
  )
  UPDATE public.players p SET 
    market_value_estimate = GREATEST(1, ROUND(mv.estimated_value)),
    market_value_confidence = mv.confidence_level,
    market_value_method = mv.method_used,
    market_value_updated_at = NOW()
  FROM market_values mv 
  WHERE p.id = mv.player_id;
  
  -- Get the row count from the update
  GET DIAGNOSTICS updated = ROW_COUNT;
  
  -- Return results
  RETURN QUERY SELECT updated;
END;
$function$
;


