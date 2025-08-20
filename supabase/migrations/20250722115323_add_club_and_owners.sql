set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_filter_options()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  EXECUTE '
    SELECT json_build_object(
      ''nationalities'', (
        SELECT json_agg(nationality ORDER BY nationality)
        FROM (
          SELECT DISTINCT nationality
          FROM players 
          WHERE nationality IS NOT NULL
          ORDER BY nationality
        ) t
      ),
      ''owners'', (
        SELECT json_agg(owner_name ORDER BY owner_name)
        FROM (
          SELECT DISTINCT owner_name
          FROM players 
          WHERE owner_name IS NOT NULL
          ORDER BY owner_name
        ) t
      ),
      ''clubs'', (
        SELECT json_agg(club_name ORDER BY club_name)
        FROM (
          SELECT DISTINCT club_name
          FROM players 
          WHERE club_name IS NOT NULL
          ORDER BY club_name
        ) t
      ),
      ''tags'', (
        SELECT json_agg(tag ORDER BY tag)
        FROM (
          SELECT DISTINCT unnest(tags) as tag
          FROM favourites
          WHERE tags IS NOT NULL
          ORDER BY tag
        ) t
      ),
      ''primaryPositions'', (
        SELECT json_agg(primary_position ORDER BY position_order)
        FROM (
          SELECT DISTINCT primary_position,
            CASE primary_position
              WHEN ''ST'' THEN 1
              WHEN ''CF'' THEN 2
              WHEN ''LW'' THEN 3
              WHEN ''RW'' THEN 4
              WHEN ''CAM'' THEN 5
              WHEN ''LM'' THEN 6
              WHEN ''RM'' THEN 7
              WHEN ''CM'' THEN 8
              WHEN ''CDM'' THEN 9
              WHEN ''LWB'' THEN 10
              WHEN ''RWB'' THEN 11
              WHEN ''LB'' THEN 12
              WHEN ''RB'' THEN 13
              WHEN ''CB'' THEN 14
              WHEN ''GK'' THEN 15
              ELSE 16
            END as position_order
          FROM players 
          WHERE primary_position IS NOT NULL
          ORDER BY position_order
        ) t
      ),
      ''secondaryPositions'', (
        SELECT json_agg(position ORDER BY position_order)
        FROM (
          SELECT DISTINCT position,
            CASE position
              WHEN ''ST'' THEN 1
              WHEN ''CF'' THEN 2
              WHEN ''LW'' THEN 3
              WHEN ''RW'' THEN 4
              WHEN ''CAM'' THEN 5
              WHEN ''LM'' THEN 6
              WHEN ''RM'' THEN 7
              WHEN ''CM'' THEN 8
              WHEN ''CDM'' THEN 9
              WHEN ''LWB'' THEN 10
              WHEN ''RWB'' THEN 11
              WHEN ''LB'' THEN 12
              WHEN ''RB'' THEN 13
              WHEN ''CB'' THEN 14
              WHEN ''GK'' THEN 15
              ELSE 16
            END as position_order
          FROM (
            SELECT unnest(secondary_positions) as position
            FROM players
            WHERE secondary_positions IS NOT NULL
          ) t
          ORDER BY position_order
        ) t
      ),
      ''bestPositions'', (
        SELECT json_agg(best_position ORDER BY position_order)
        FROM (
          SELECT DISTINCT best_position,
            CASE best_position
              WHEN ''ST'' THEN 1
              WHEN ''CF'' THEN 2
              WHEN ''LW'' THEN 3
              WHEN ''RW'' THEN 4
              WHEN ''CAM'' THEN 5
              WHEN ''LM'' THEN 6
              WHEN ''RM'' THEN 7
              WHEN ''CM'' THEN 8
              WHEN ''CDM'' THEN 9
              WHEN ''LWB'' THEN 10
              WHEN ''RWB'' THEN 11
              WHEN ''LB'' THEN 12
              WHEN ''RB'' THEN 13
              WHEN ''CB'' THEN 14
              WHEN ''GK'' THEN 15
              ELSE 16
            END as position_order
          FROM players 
          WHERE best_position IS NOT NULL
          ORDER BY position_order
        ) t
      ),
      ''preferredFoot'', (
        SELECT json_agg(preferred_foot ORDER BY preferred_foot)
        FROM (
          SELECT DISTINCT preferred_foot
          FROM players 
          WHERE preferred_foot IS NOT NULL
          ORDER BY preferred_foot
        ) t
      )
    )
  ' INTO result;
  
  RETURN result;
END;
$function$
;


