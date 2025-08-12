alter table "public"."players" add column "base_value_estimate" integer;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_base_player_value(player_overall integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
BEGIN
  -- Validate input
  IF player_overall IS NULL OR player_overall < 20 OR player_overall > 99 THEN
    RETURN NULL;
  END IF;
  
  -- Apply the four-segment exponential pricing formula
  IF player_overall >= 20 AND player_overall <= 50 THEN
    -- Low-rated players: slower growth
    RETURN ROUND(0.27137949 * EXP(0.04308251 * player_overall), 2);
  ELSIF player_overall >= 50 AND player_overall <= 70 THEN
    -- Standard players: moderate growth  
    RETURN ROUND(0.00643289 * EXP(0.11906261 * player_overall), 2);
  ELSIF player_overall >= 70 AND player_overall <= 85 THEN
    -- High-end players: steady growth
    RETURN ROUND(0.00332713 * EXP(0.12718378 * player_overall), 2);
  ELSIF player_overall >= 85 AND player_overall <= 99 THEN
    -- Elite players: explosive growth
    RETURN ROUND(0.00000349 * EXP(0.20946442 * player_overall), 2);
  ELSE
    RETURN NULL;
  END IF;
END;
$function$
;

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
    base_value_estimate = calculate_base_player_value(overall),
    updated_at = NOW()
  WHERE overall IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$function$
;


