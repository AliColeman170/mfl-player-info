set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_all_player_base_values()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update players with calculated base values
  UPDATE public.players 
  SET 
    base_value_estimate = public.calculate_base_player_value(overall),
    updated_at = NOW()
  WHERE overall IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$function$
;


