set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_comprehensive_player_value(player_overall integer, player_age integer, player_position text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE
  base_value NUMERIC;
  market_multiplier NUMERIC;
  final_price NUMERIC;
  overall_range TEXT;
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
  
  -- Determine overall range for market multiplier lookup
  overall_range := CASE
    WHEN player_overall >= 97 THEN '97-99'
    WHEN player_overall >= 94 THEN '94-96'
    WHEN player_overall >= 91 THEN '91-93'
    WHEN player_overall >= 88 THEN '88-90'
    WHEN player_overall >= 85 THEN '85-87'
    WHEN player_overall >= 82 THEN '82-84'
    WHEN player_overall >= 79 THEN '79-81'
    WHEN player_overall >= 76 THEN '76-78'
    WHEN player_overall >= 73 THEN '73-75'
    WHEN player_overall >= 70 THEN '70-72'
    WHEN player_overall >= 67 THEN '67-69'
    WHEN player_overall >= 64 THEN '64-66'
    WHEN player_overall >= 61 THEN '61-63'
    WHEN player_overall >= 58 THEN '58-60'
    WHEN player_overall >= 55 THEN '55-57'
    WHEN player_overall >= 52 THEN '52-54'
    WHEN player_overall >= 49 THEN '49-51'
    WHEN player_overall >= 46 THEN '46-48'
    WHEN player_overall >= 43 THEN '43-45'
    ELSE '40-42'
  END;
  
  -- Get market multiplier from market_multipliers table
  SELECT multiplier INTO market_multiplier
  FROM public.market_multipliers
  WHERE position = player_position
    AND age_range = player_age::TEXT
    AND overall_range = overall_range
  LIMIT 1;
  
  -- Fallback to average multiplier for position if specific combination not found
  IF market_multiplier IS NULL THEN
    SELECT AVG(multiplier) INTO market_multiplier
    FROM public.market_multipliers
    WHERE position = player_position
      AND overall_range = overall_range;
  END IF;
  
  -- Final fallback to hardcoded multipliers if no market data
  IF market_multiplier IS NULL THEN
    market_multiplier := CASE player_position
      WHEN 'LW' THEN 1.30   -- Updated based on recent analysis
      WHEN 'LM' THEN 1.25
      WHEN 'RW' THEN 1.20
      WHEN 'RM' THEN 1.15
      WHEN 'ST' THEN 1.10
      WHEN 'CM' THEN 1.05
      WHEN 'CAM' THEN 1.00
      WHEN 'CF' THEN 1.00
      WHEN 'CDM' THEN 0.95
      WHEN 'RB' THEN 0.95
      WHEN 'LB' THEN 0.90
      WHEN 'RWB' THEN 0.90
      WHEN 'LWB' THEN 0.90
      WHEN 'CB' THEN 0.85
      WHEN 'GK' THEN 0.70
      ELSE 1.00
    END;
  END IF;
  
  -- Calculate final price using market-based multiplier
  final_price := base_value * market_multiplier;
  
  -- Apply minimum price floor
  IF final_price < 1 THEN
    final_price := 1;
  END IF;
  
  RETURN ROUND(final_price, 2);
END;
$function$
;


