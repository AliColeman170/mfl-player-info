set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 5000, offset_val integer DEFAULT 0)
 RETURNS TABLE(processed_count integer, updated_count integer, error_count integer, total_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  total INTEGER;
  updated INTEGER := 0;
  processed INTEGER := 0;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total FROM public.players WHERE overall IS NOT NULL;
  
  -- Bulk update players using single SQL statement with pre-aggregated data
  WITH batch_players AS (
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  ),
  player_summaries AS (
    SELECT 
      bp.id as player_id,
      bp.overall,
      bp.age,
      bp.primary_position,
      ss.position,
      ss.age_center,
      ss.age_range,
      ss.overall_center,
      ss.overall_range,
      ss.sample_count,
      ss.avg_price,
      ss.price_trend,
      ss.recent_sales_data,
      -- Calculate distance to find best match
      ABS(ss.age_center - bp.age) + ABS(ss.overall_center - bp.overall) as match_distance,
      ROW_NUMBER() OVER (
        PARTITION BY bp.id 
        ORDER BY 
          ABS(ss.age_center - bp.age) + ABS(ss.overall_center - bp.overall),
          ss.sample_count DESC
      ) as rn
    FROM batch_players bp
    LEFT JOIN public.sales_summary ss ON (
      ss.position = bp.primary_position
      AND ss.age_center BETWEEN (bp.age - 4) AND (bp.age + 4)
      AND ss.overall_center BETWEEN (bp.overall - 4) AND (bp.overall + 4)
      AND ss.sample_count >= 5
    )
  ),
  best_matches AS (
    SELECT * FROM player_summaries WHERE rn = 1
  ),
  market_values AS (
    SELECT 
      bm.player_id,
      bm.overall,
      bm.age,
      bm.primary_position,
      -- Calculate market value based on available data
      CASE 
        WHEN bm.sample_count >= 20 AND bm.recent_sales_data IS NOT NULL THEN
          -- High sample: Use EMA calculation
          GREATEST(1, ROUND(public.calculate_ema_from_sales_data(bm.recent_sales_data)))
        WHEN bm.sample_count >= 5 THEN
          -- Medium sample: Use average with trend
          GREATEST(1, ROUND(bm.avg_price * (1 + COALESCE(bm.price_trend, 0))))
        ELSE
          -- Fallback to comprehensive formula
          GREATEST(1, ROUND(public.calculate_comprehensive_player_value(bm.overall, bm.age, bm.primary_position)))
      END as estimated_value,
      
      -- Determine confidence and method
      CASE 
        WHEN bm.sample_count >= 20 THEN 'High'
        WHEN bm.sample_count >= 5 THEN 'Medium'
        ELSE 'Low'
      END as confidence_level,
      
      CASE 
        WHEN bm.sample_count >= 20 THEN 'Data-driven (High Sample)'
        WHEN bm.sample_count >= 5 THEN 'Data-driven (Medium Sample)'
        ELSE 'Formula Fallback'
      END as method_used,
      
      COALESCE(bm.sample_count, 0) as sample_size,
      
      CASE 
        WHEN bm.sample_count >= 5 THEN
          format('Pre-aggregated data: %s samples for %s age %s-%s, overall %s-%s',
            bm.sample_count,
            bm.position,
            bm.age_center - bm.age_range,
            bm.age_center + bm.age_range,
            bm.overall_center - bm.overall_range,
            bm.overall_center + bm.overall_range
          )
        ELSE
          format('Comprehensive formula for %s %s yo %s ovr (no market data)',
            bm.primary_position, bm.age, bm.overall)
      END as based_on_text
    FROM best_matches bm
  )
  UPDATE public.players p
  SET 
    market_value_estimate = mv.estimated_value,
    market_value_low = CASE 
      WHEN mv.confidence_level = 'High' THEN ROUND(mv.estimated_value * 0.85)
      WHEN mv.confidence_level = 'Medium' THEN ROUND(mv.estimated_value * 0.8)  
      ELSE ROUND(mv.estimated_value * 0.7)
    END,
    market_value_high = CASE 
      WHEN mv.confidence_level = 'High' THEN ROUND(mv.estimated_value * 1.15)
      WHEN mv.confidence_level = 'Medium' THEN ROUND(mv.estimated_value * 1.2)
      ELSE ROUND(mv.estimated_value * 1.3)
    END,
    market_value_confidence = mv.confidence_level,
    market_value_method = mv.method_used,
    market_value_sample_size = mv.sample_size,
    market_value_based_on = mv.based_on_text,
    market_value_updated_at = NOW(),
    base_value_estimate = ROUND(public.calculate_base_player_value(mv.overall))
  FROM market_values mv
  WHERE p.id = mv.player_id;
  
  -- Get count of how many were actually updated
  GET DIAGNOSTICS updated = ROW_COUNT;
  
  -- Count how many we processed (selected for update)
  SELECT COUNT(*) INTO processed FROM (
    SELECT id
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  ) batch_count;
  
  -- Return results
  RETURN QUERY SELECT processed, updated, 0, total;
END;
$function$
;


