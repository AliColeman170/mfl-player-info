set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.test_pricing_model_accuracy(days_back integer DEFAULT 90, sample_size integer DEFAULT 1000)
 RETURNS TABLE(test_count bigint, avg_actual_price numeric, avg_predicted_price numeric, avg_absolute_error numeric, avg_percentage_error numeric, median_percentage_error numeric, accuracy_within_10_percent numeric, accuracy_within_20_percent numeric, accuracy_within_30_percent numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH test_data AS (
    SELECT 
      COALESCE(s.player_overall, p.overall) as rating,
      COALESCE(s.player_age, p.age) as age,
      COALESCE(s.player_position, p.primary_position) as position,
      s.price as actual_price,
      public.calculate_comprehensive_player_value(
        COALESCE(s.player_overall, p.overall),
        COALESCE(s.player_age, p.age),
        COALESCE(s.player_position, p.primary_position)
      ) as predicted_price
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND s.price BETWEEN 1 AND 1000  -- Filter extreme outliers
      AND COALESCE(s.player_overall, p.overall) IS NOT NULL
      AND COALESCE(s.player_age, p.age) IS NOT NULL
      AND COALESCE(s.player_position, p.primary_position) IS NOT NULL
    ORDER BY RANDOM()
    LIMIT sample_size
  ),
  error_calculations AS (
    SELECT 
      actual_price,
      predicted_price,
      ABS(predicted_price - actual_price) as absolute_error,
      ABS(predicted_price - actual_price) / NULLIF(actual_price, 0) * 100 as percentage_error
    FROM test_data
    WHERE predicted_price IS NOT NULL
  )
  SELECT 
    COUNT(*) as test_count,
    ROUND(AVG(actual_price), 2) as avg_actual_price,
    ROUND(AVG(predicted_price), 2) as avg_predicted_price,
    ROUND(AVG(absolute_error), 2) as avg_absolute_error,
    ROUND(AVG(percentage_error), 2) as avg_percentage_error,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage_error)::NUMERIC, 2) as median_percentage_error,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 10)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_10_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 20)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_20_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 30)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_30_percent
  FROM error_calculations;
END;
$function$
;


