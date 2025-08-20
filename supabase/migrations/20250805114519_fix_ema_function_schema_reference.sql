set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_player_market_value_fast(player_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    player_rec RECORD;
    summary_rec RECORD;
    estimated_value INTEGER;
    price_range_low INTEGER;
    price_range_high INTEGER;
    confidence_level TEXT;
    method_used TEXT;
    sample_size INTEGER;
    based_on_text TEXT;
BEGIN
    -- Get player data
    SELECT overall, age, primary_position, first_name, last_name
    INTO player_rec
    FROM public.players
    WHERE id = player_id;
    
    IF NOT FOUND OR player_rec.overall IS NULL OR player_rec.age IS NULL THEN
        RETURN;
    END IF;
    
    -- Find best matching summary data (exact match first, then closest)
    SELECT *
    INTO summary_rec
    FROM public.sales_summary
    WHERE position = player_rec.primary_position
    AND age_center BETWEEN (player_rec.age - 4) AND (player_rec.age + 4)
    AND overall_center BETWEEN (player_rec.overall - 4) AND (player_rec.overall + 4)
    ORDER BY 
        -- Prefer exact matches
        ABS(age_center - player_rec.age) + ABS(overall_center - player_rec.overall),
        sample_count DESC
    LIMIT 1;
    
    IF FOUND AND summary_rec.sample_count >= 5 THEN
        -- Use pre-aggregated data for calculation
        IF summary_rec.sample_count >= 20 AND summary_rec.recent_sales_data IS NOT NULL THEN
            -- High sample: Use EMA from recent sales data
            estimated_value := GREATEST(1, ROUND(
                public.calculate_ema_from_sales_data(summary_rec.recent_sales_data)
            ));
            confidence_level := 'High';
            method_used := 'Data-driven (High Sample)';
        ELSIF summary_rec.sample_count >= 5 THEN
            -- Medium sample: Use average with trend adjustment
            estimated_value := GREATEST(1, ROUND(
                summary_rec.avg_price * (1 + COALESCE(summary_rec.price_trend, 0))
            ));
            confidence_level := 'Medium';
            method_used := 'Data-driven (Medium Sample)';
        ELSE
            -- Low sample: Use median price
            estimated_value := GREATEST(1, ROUND(summary_rec.median_price));
            confidence_level := 'Low';
            method_used := 'Data-driven (Low Sample)';
        END IF;
        
        sample_size := summary_rec.sample_count;
        based_on_text := format('Pre-aggregated data: %s samples for %s age %s-%s, overall %s-%s',
            summary_rec.sample_count,
            summary_rec.position,
            summary_rec.age_center - summary_rec.age_range,
            summary_rec.age_center + summary_rec.age_range,
            summary_rec.overall_center - summary_rec.overall_range,
            summary_rec.overall_center + summary_rec.overall_range
        );
        
        -- Calculate price range based on confidence
        CASE confidence_level
            WHEN 'High' THEN
                price_range_low := ROUND(estimated_value * 0.85);
                price_range_high := ROUND(estimated_value * 1.15);
            WHEN 'Medium' THEN  
                price_range_low := ROUND(estimated_value * 0.8);
                price_range_high := ROUND(estimated_value * 1.2);
            ELSE
                price_range_low := ROUND(estimated_value * 0.7);
                price_range_high := ROUND(estimated_value * 1.3);
        END CASE;
    ELSE
        -- Fallback to comprehensive formula if no summary data
        estimated_value := GREATEST(1, ROUND(
            public.calculate_comprehensive_player_value(
                player_rec.overall, 
                player_rec.age, 
                player_rec.primary_position
            )
        ));
        price_range_low := ROUND(estimated_value * 0.8);
        price_range_high := ROUND(estimated_value * 1.2);
        confidence_level := 'Low';
        method_used := 'Formula Fallback';
        sample_size := 0;
        based_on_text := format('Comprehensive formula for %s %s yo %s ovr (no market data)',
            player_rec.primary_position, player_rec.age, player_rec.overall);
    END IF;
    
    -- Update player record
    UPDATE public.players
    SET 
        market_value_estimate = estimated_value,
        market_value_low = price_range_low,
        market_value_high = price_range_high,
        market_value_confidence = confidence_level,
        market_value_method = method_used,
        market_value_sample_size = sample_size,
        market_value_based_on = based_on_text,
        market_value_updated_at = NOW(),
        base_value_estimate = ROUND(public.calculate_base_player_value(player_rec.overall))
    WHERE id = player_id;
END;
$function$
;


