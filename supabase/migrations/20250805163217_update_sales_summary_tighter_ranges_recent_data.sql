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
      AND ss.age_center BETWEEN (bp.age - 2) AND (bp.age + 2)
      AND ss.overall_center BETWEEN (bp.overall - 2) AND (bp.overall + 2)
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

CREATE OR REPLACE FUNCTION public.update_sales_summary()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    pos VARCHAR(10);
    age_val INTEGER;
    overall_val INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Clear existing summary data
    DELETE FROM public.sales_summary WHERE id IS NOT NULL;
    
    -- Generate summary for common position/age/overall combinations
    FOR pos IN SELECT DISTINCT player_position FROM public.sales WHERE player_position IS NOT NULL
    LOOP
        FOR age_val IN SELECT generate_series(18, 38, 2) -- Every 2 years from 18-38
        LOOP
            FOR overall_val IN SELECT generate_series(45, 95, 5) -- Every 5 overall from 45-95
            LOOP
                -- Insert simplified summary data
                WITH sales_data AS (
                    SELECT 
                        s.price,
                        COALESCE(s.purchase_date_time, s.created_date_time) as sale_date,
                        ROW_NUMBER() OVER (ORDER BY COALESCE(s.purchase_date_time, s.created_date_time) DESC) as rn
                    FROM public.sales s
                    WHERE s.player_position = pos
                    AND s.player_age BETWEEN (age_val - 1) AND (age_val + 1)
                    AND s.player_overall BETWEEN (overall_val - 1) AND (overall_val + 1)
                    AND s.price > 0
                    AND s.status = 'BOUGHT'
                    -- Only recent sales (last 180 days for more current pricing)
                    AND COALESCE(s.purchase_date_time, s.created_date_time) >= EXTRACT(EPOCH FROM (NOW() - INTERVAL '180 days')) * 1000
                    -- Filter out obvious outliers (very low or very high prices)
                    AND s.price BETWEEN 1 AND 15000
                )
                INSERT INTO public.sales_summary (
                    position, age_center, overall_center, age_range, overall_range,
                    sample_count, avg_price, median_price, recent_sales_data, price_trend
                )
                SELECT 
                    pos,
                    age_val,
                    overall_val,
                    1, -- ±1 range  
                    1, -- ±1 range
                    COUNT(*),
                    ROUND(AVG(price)::NUMERIC, 2),
                    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::NUMERIC, 2),
                    -- Store recent sales for EMA (last 50 sales, with dates)
                    COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'price', price,
                                'date', sale_date
                            ) 
                            ORDER BY sale_date DESC
                        ) FILTER (WHERE rn <= 50),
                        '[]'::jsonb
                    ),
                    0.0 -- Default price trend for now
                FROM sales_data
                HAVING COUNT(*) >= 5; -- Only store if we have at least 5 sales
                
                -- Count this iteration
                updated_count := updated_count + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$function$
;


