set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.analyze_multi_variable_pricing(days_back integer DEFAULT 90, min_sales integer DEFAULT 50)
 RETURNS TABLE(overall_rating integer, player_age integer, player_position text, avg_price numeric, trimmed_avg_price numeric, sale_count bigint, base_value_estimate numeric, position_premium numeric, age_factor numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT 
      COALESCE(s.player_overall, p.overall) as rating,
      COALESCE(s.player_age, p.age) as age,
      COALESCE(s.player_position, p.primary_position) as position,
      s.price,
      s.listing_resource_id
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND COALESCE(s.player_overall, p.overall) IS NOT NULL
      AND COALESCE(s.player_age, p.age) IS NOT NULL
      AND COALESCE(s.player_position, p.primary_position) IS NOT NULL
      AND COALESCE(s.player_overall, p.overall) BETWEEN 40 AND 95
      AND COALESCE(s.player_age, p.age) BETWEEN 16 AND 35
  ),
  percentile_trimmed AS (
    SELECT 
      rating, age, position, price, listing_resource_id,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY rating, age, position) as p5,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY rating, age, position) as p95
    FROM filtered_sales
  ),
  trimmed_sales AS (
    SELECT rating, age, position, price, listing_resource_id
    FROM percentile_trimmed
    WHERE price BETWEEN p5 AND p95
  ),
  position_baseline AS (
    SELECT 
      position,
      AVG(price) as position_avg_price
    FROM trimmed_sales
    GROUP BY position
  ),
  age_baseline AS (
    SELECT 
      age,
      AVG(price) as age_avg_price
    FROM trimmed_sales
    GROUP BY age
  )
  SELECT 
    fs.rating as overall_rating,
    fs.age as player_age,
    fs.position as player_position,
    ROUND(AVG(fs.price), 2) as avg_price,
    ROUND(AVG(ts.price), 2) as trimmed_avg_price,
    COUNT(fs.listing_resource_id) as sale_count,
    public.calculate_base_player_value(fs.rating) as base_value_estimate,
    ROUND(pb.position_avg_price / (SELECT AVG(position_avg_price) FROM position_baseline), 3) as position_premium,
    ROUND(ab.age_avg_price / (SELECT AVG(age_avg_price) FROM age_baseline), 3) as age_factor
  FROM filtered_sales fs
  LEFT JOIN trimmed_sales ts ON fs.rating = ts.rating AND fs.age = ts.age AND fs.position = ts.position
  LEFT JOIN position_baseline pb ON fs.position = pb.position
  LEFT JOIN age_baseline ab ON fs.age = ab.age
  GROUP BY fs.rating, fs.age, fs.position, pb.position_avg_price, ab.age_avg_price
  HAVING COUNT(fs.listing_resource_id) >= min_sales
  ORDER BY fs.rating, fs.age, fs.position;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_comprehensive_player_value(player_overall integer, player_age integer, player_position text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE
  base_value NUMERIC;
  age_multiplier NUMERIC;
  position_multiplier NUMERIC;
  final_price NUMERIC;
BEGIN
  -- Validate inputs
  IF player_overall IS NULL OR player_age IS NULL OR player_position IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF player_overall < 20 OR player_overall > 99 OR player_age < 16 OR player_age > 40 THEN
    RETURN NULL;
  END IF;
  
  -- Get base value from overall rating using our exponential formula
  base_value := public.calculate_base_player_value(player_overall);
  
  -- Age multiplier based on age curve analysis (peak at 16 and 26)
  age_multiplier := CASE
    -- Young prodigy premium (16-18)
    WHEN player_age = 16 THEN 2.20
    WHEN player_age = 17 THEN 1.75
    WHEN player_age = 18 THEN 1.35
    WHEN player_age = 19 THEN 1.20
    WHEN player_age = 20 THEN 1.10
    -- Prime years (21-28)
    WHEN player_age BETWEEN 21 AND 23 THEN 1.00
    WHEN player_age BETWEEN 24 AND 26 THEN 1.05  -- Peak experience
    WHEN player_age BETWEEN 27 AND 28 THEN 1.00
    -- Decline years (29+)
    WHEN player_age = 29 THEN 0.90
    WHEN player_age = 30 THEN 0.85
    WHEN player_age = 31 THEN 0.80
    WHEN player_age = 32 THEN 0.75
    WHEN player_age = 33 THEN 0.70
    WHEN player_age = 34 THEN 0.65
    WHEN player_age >= 35 THEN 0.60
    ELSE 1.00
  END;
  
  -- Position multiplier based on market analysis
  position_multiplier := CASE player_position
    WHEN 'LW' THEN 1.12   -- Highest valued
    WHEN 'LM' THEN 1.09
    WHEN 'RW' THEN 1.06
    WHEN 'RM' THEN 1.05
    WHEN 'ST' THEN 1.04
    WHEN 'CM' THEN 1.02
    WHEN 'CAM' THEN 1.00
    WHEN 'CF' THEN 1.00
    WHEN 'CDM' THEN 0.97
    WHEN 'RB' THEN 0.97
    WHEN 'LB' THEN 0.95
    WHEN 'RWB' THEN 0.95
    WHEN 'LWB' THEN 0.95
    WHEN 'CB' THEN 0.94
    WHEN 'GK' THEN 0.79   -- Significant discount for specialists
    ELSE 1.00
  END;
  
  -- Calculate final price
  final_price := base_value * age_multiplier * position_multiplier;
  
  -- Apply minimum price floor
  IF final_price < 1 THEN
    final_price := 1;
  END IF;
  
  RETURN ROUND(final_price, 2);
END;
$function$
;

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
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage_error), 2) as median_percentage_error,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 10)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_10_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 20)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_20_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 30)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_30_percent
  FROM error_calculations;
END;
$function$
;


