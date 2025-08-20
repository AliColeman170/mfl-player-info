set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.trigger_update_player_market_value()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Only update if relevant fields changed or it's a new player
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.overall IS DISTINCT FROM NEW.overall OR
       OLD.age IS DISTINCT FROM NEW.age OR
       OLD.primary_position IS DISTINCT FROM NEW.primary_position OR
       OLD.market_value_estimate IS NULL OR
       OLD.base_value_estimate IS NULL
     )) THEN
    
    -- Update market value using our comprehensive function
    PERFORM public.update_player_market_value(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_all_players_market_values()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
  player_record RECORD;
BEGIN
  -- Process players in batches to avoid long-running transactions
  FOR player_record IN 
    SELECT id FROM public.players 
    WHERE overall IS NOT NULL 
    ORDER BY id
  LOOP
    PERFORM public.update_player_market_value(player_record.id);
    updated_count := updated_count + 1;
    
    -- Log progress every 10000 records
    IF updated_count % 10000 = 0 THEN
      RAISE NOTICE 'Updated % players market values', updated_count;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_player_market_value(player_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_record RECORD;
  base_estimate NUMERIC;
  comprehensive_estimate NUMERIC;
  low_estimate INTEGER;
  high_estimate INTEGER;
  confidence_level TEXT;
  estimation_method TEXT;
  actual_sample_count INTEGER;
  based_on_info TEXT;
  confidence_multiplier NUMERIC;
  days_back INTEGER := 90;
BEGIN
  -- Get player data
  SELECT 
    id, overall, age, primary_position, 
    first_name, last_name
  INTO player_record
  FROM public.players 
  WHERE id = player_id;
  
  -- Skip if player not found or missing required data
  IF NOT FOUND OR player_record.overall IS NULL THEN
    RETURN;
  END IF;
  
  -- Get actual sample count from sales data for similar players
  SELECT COUNT(*)::INTEGER INTO actual_sample_count
  FROM public.sales s
  INNER JOIN public.players p ON s.player_id = p.id
  WHERE 
    (CASE 
      WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
      THEN to_timestamp(s.purchase_date_time / 1000)
      ELSE to_timestamp(s.created_date_time / 1000)
    END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    AND s.price > 0
    -- Match similar players (±2 rating, ±2 age, same position)
    AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 2
    AND (player_record.age IS NULL OR ABS(COALESCE(s.player_age, p.age) - player_record.age) <= 2)
    AND (player_record.primary_position IS NULL OR 
         COALESCE(s.player_position, p.primary_position) = player_record.primary_position);
  
  -- If no exact matches, try broader search (±5 rating, same position)
  IF actual_sample_count = 0 THEN
    SELECT COUNT(*)::INTEGER INTO actual_sample_count
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 5
      AND (player_record.primary_position IS NULL OR 
           COALESCE(s.player_position, p.primary_position) = player_record.primary_position);
  END IF;
  
  -- If still no matches, try rating range only
  IF actual_sample_count = 0 THEN
    SELECT COUNT(*)::INTEGER INTO actual_sample_count
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 10;
  END IF;
  
  -- Default to 0 if no sales found
  IF actual_sample_count IS NULL THEN
    actual_sample_count := 0;
  END IF;
  
  -- Calculate base estimate using our comprehensive model
  comprehensive_estimate := public.calculate_comprehensive_player_value(
    player_record.overall,
    player_record.age,
    player_record.primary_position
  );
  
  -- Use comprehensive estimate as primary estimate
  base_estimate := comprehensive_estimate;
  
  -- Calculate confidence based on actual sample size and model accuracy
  IF actual_sample_count >= 1000 THEN
    confidence_level := 'High';
    confidence_multiplier := 0.80; -- ±20% range
    estimation_method := 'Data-driven (High Sample)';
  ELSIF actual_sample_count >= 100 THEN
    confidence_level := 'Medium';
    confidence_multiplier := 0.70; -- ±30% range
    estimation_method := 'Data-driven (Medium Sample)';
  ELSIF actual_sample_count >= 10 THEN
    confidence_level := 'Low';
    confidence_multiplier := 0.60; -- ±40% range
    estimation_method := 'Data-driven (Low Sample)';
  ELSE
    -- No sales data, use model-based confidence
    IF player_record.overall >= 85 THEN
      confidence_level := 'Very Low';
      confidence_multiplier := 0.50; -- ±50% range
    ELSIF player_record.overall >= 50 THEN
      confidence_level := 'Low';
      confidence_multiplier := 0.65; -- ±35% range
    ELSE
      confidence_level := 'Medium';
      confidence_multiplier := 0.75; -- ±25% range
    END IF;
    estimation_method := 'Model-based (No Sales Data)';
  END IF;
  
  -- Calculate range based on confidence
  low_estimate := ROUND(base_estimate * confidence_multiplier);
  high_estimate := ROUND(base_estimate * (2.0 - confidence_multiplier));
  
  -- Ensure minimum values and logical ranges
  IF low_estimate < 1 THEN low_estimate := 1; END IF;
  IF high_estimate < low_estimate + 1 THEN high_estimate := low_estimate + 1; END IF;
  IF base_estimate < 1 THEN base_estimate := 1; END IF;
  
  -- Based on description
  based_on_info := 'Multi-variable model (Rating: ' || player_record.overall || 
                   CASE WHEN player_record.age IS NOT NULL THEN ', Age: ' || player_record.age ELSE '' END ||
                   CASE WHEN player_record.primary_position IS NOT NULL THEN ', Position: ' || player_record.primary_position ELSE '' END ||
                   ') - ' || actual_sample_count || ' similar sales';
  
  -- Update player record - update base_value_estimate first, then market values
  UPDATE public.players 
  SET 
    base_value_estimate = ROUND(base_estimate)::INTEGER,
    market_value_estimate = ROUND(base_estimate)::INTEGER,
    market_value_low = low_estimate,
    market_value_high = high_estimate,
    market_value_confidence = confidence_level,
    market_value_method = estimation_method,
    market_value_sample_size = actual_sample_count,
    market_value_based_on = based_on_info,
    market_value_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = player_id;
  
END;
$function$
;

CREATE TRIGGER player_market_value_update_trigger AFTER INSERT OR UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION trigger_update_player_market_value();


