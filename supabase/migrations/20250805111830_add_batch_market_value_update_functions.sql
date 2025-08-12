drop function if exists "public"."update_players_market_values_batch"(batch_size integer, offset_start integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 100, offset_val integer DEFAULT 0)
 RETURNS TABLE(processed_count integer, updated_count integer, error_count integer, total_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_rec RECORD;
  processed INTEGER := 0;
  updated INTEGER := 0;
  errors INTEGER := 0;
  total INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total FROM public.players WHERE overall IS NOT NULL;
  
  -- Process batch of players
  FOR player_rec IN 
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  LOOP
    BEGIN
      processed := processed + 1;
      
      -- Update this player's market value
      PERFORM public.update_player_market_value(player_rec.id);
      updated := updated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      -- Log error but continue processing
      RAISE NOTICE 'Error updating player %: %', player_rec.id, SQLERRM;
    END;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT processed, updated, errors, total;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_market_value_updates(test_count integer DEFAULT 10)
 RETURNS TABLE(player_id bigint, first_name text, last_name text, overall integer, age integer, player_position text, old_method text, new_method text, old_value integer, new_value integer, sample_size integer, confidence text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_record RECORD;
BEGIN
  -- Get a sample of players and their current values
  FOR player_record IN
    SELECT 
      p.id,
      p.first_name,
      p.last_name,
      p.overall,
      p.age,
      p.primary_position AS player_position,
      p.market_value_method AS old_method_val,
      p.market_value_estimate AS old_estimate
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
      player_record.player_position,
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


