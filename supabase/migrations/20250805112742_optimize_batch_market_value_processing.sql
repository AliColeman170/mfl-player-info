set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 25, offset_val integer DEFAULT 0)
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
  start_time TIMESTAMP;
BEGIN
  start_time := clock_timestamp();
  
  -- Get total count (cached to avoid repeated counting)
  SELECT COUNT(*) INTO total FROM public.players WHERE overall IS NOT NULL;
  
  -- Process batch of players with timeout protection
  FOR player_rec IN 
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  LOOP
    BEGIN
      processed := processed + 1;
      
      -- Check if we're approaching timeout (50 seconds)
      IF EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) > 50 THEN
        RAISE NOTICE 'Approaching timeout, stopping batch at player %', player_rec.id;
        EXIT;
      END IF;
      
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


