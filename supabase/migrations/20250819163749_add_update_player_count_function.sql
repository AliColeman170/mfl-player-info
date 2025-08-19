set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_total_player_count()
 RETURNS TABLE(total_count bigint, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_count bigint;
BEGIN
  -- Get the total count of players
  SELECT COUNT(*) INTO player_count FROM public.players;
  
  -- Upsert the config value
  INSERT INTO public.sync_config (config_key, config_value, updated_at)
  VALUES ('total_player_count', player_count::text, NOW())
  ON CONFLICT (config_key) 
  DO UPDATE SET 
    config_value = player_count::text,
    updated_at = NOW();
  
  -- Return the count and timestamp
  RETURN QUERY
  SELECT 
    player_count as total_count,
    NOW() as updated_at;
END;
$function$
;


