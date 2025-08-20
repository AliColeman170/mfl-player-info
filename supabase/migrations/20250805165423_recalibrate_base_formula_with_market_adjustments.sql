set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_base_player_value(player_overall integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE
  base_formula NUMERIC;
  market_adjustment NUMERIC;
BEGIN
  -- Validate input
  IF player_overall IS NULL OR player_overall < 20 OR player_overall > 99 THEN
    RETURN NULL;
  END IF;
  
  -- Apply the four-segment exponential pricing formula
  IF player_overall >= 20 AND player_overall <= 50 THEN
    -- Low-rated players: slower growth
    base_formula := 0.27137949 * EXP(0.04308251 * player_overall);
  ELSIF player_overall >= 50 AND player_overall <= 70 THEN
    -- Standard players: moderate growth  
    base_formula := 0.00643289 * EXP(0.11906261 * player_overall);
  ELSIF player_overall >= 70 AND player_overall <= 85 THEN
    -- High-end players: steady growth
    base_formula := 0.00332713 * EXP(0.12718378 * player_overall);
  ELSIF player_overall >= 85 AND player_overall <= 99 THEN
    -- Elite players: explosive growth
    base_formula := 0.00000349 * EXP(0.20946442 * player_overall);
  ELSE
    RETURN NULL;
  END IF;
  
  -- Apply market-based adjustment factors (based on 180-day analysis)
  IF player_overall >= 85 THEN
    -- Elite players: 26% market premium
    market_adjustment := 1.26;
  ELSIF player_overall >= 75 THEN
    -- Mid-tier players: 13% market premium
    market_adjustment := 1.13;
  ELSE
    -- Lower players: 16% market premium
    market_adjustment := 1.16;
  END IF;
  
  RETURN ROUND(base_formula * market_adjustment, 2);
END;
$function$
;


