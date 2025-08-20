set check_function_bodies = off;

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
                    AND s.player_age BETWEEN (age_val - 3) AND (age_val + 3)
                    AND s.player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)
                    AND s.price > 0
                    AND s.status = 'BOUGHT'
                    -- Only recent sales (last 12 months)
                    AND COALESCE(s.purchase_date_time, s.created_date_time) >= EXTRACT(EPOCH FROM (NOW() - INTERVAL '12 months')) * 1000
                )
                INSERT INTO public.sales_summary (
                    position, age_center, overall_center, age_range, overall_range,
                    sample_count, avg_price, median_price, recent_sales_data, price_trend
                )
                SELECT 
                    pos,
                    age_val,
                    overall_val,
                    3, -- ±3 range
                    3, -- ±3 range
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


