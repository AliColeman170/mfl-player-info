set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.test_market_value_updates(test_count integer DEFAULT 10)
 RETURNS TABLE(player_id bigint, first_name text, last_name text, overall integer, age integer, player_position text, old_method text, new_method text, old_value integer, new_value integer, sample_size integer, confidence text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_record RECORD;
BEGIN
  -- Get a sample of players and show before/after comparison
  FOR player_record IN 
    SELECT 
      p.id, p.first_name, p.last_name, p.overall, p.age, p.primary_position,
      p.market_value_method as old_method_val,
      p.market_value_estimate as old_estimate
    FROM public.players p
    WHERE p.overall IS NOT NULL 
    AND p.overall BETWEEN 50 AND 80  -- Focus on mid-range players for testing
    ORDER BY RANDOM()
    LIMIT test_count
  LOOP
    -- Store old values and update the player
    PERFORM public.update_player_market_value(player_record.id);
    
    -- Return comparison data
    RETURN QUERY
    SELECT 
      player_record.id,
      player_record.first_name,
      player_record.last_name,
      player_record.overall,
      player_record.age,
      player_record.primary_position,
      player_record.old_method_val,
      p.market_value_method,
      player_record.old_estimate,
      p.market_value_estimate,
      p.market_value_sample_size,
      p.market_value_confidence
    FROM public.players p
    WHERE p.id = player_record.id;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 1000, offset_start integer DEFAULT 0)
 RETURNS TABLE(updated_count integer, batch_start integer, batch_end integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_record RECORD;
  current_count INTEGER := 0;
  start_id INTEGER;
  end_id INTEGER;
BEGIN
  -- Get the batch of players to update
  FOR player_record IN 
    SELECT id FROM public.players 
    WHERE overall IS NOT NULL 
    ORDER BY id
    LIMIT batch_size OFFSET offset_start
  LOOP
    -- Track start and end IDs
    IF current_count = 0 THEN
      start_id := player_record.id;
    END IF;
    end_id := player_record.id;
    
    -- Update this player
    PERFORM public.update_player_market_value(player_record.id);
    current_count := current_count + 1;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT current_count, start_id, end_id;
END;
$function$
;


