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
        SELECT json_agg(DISTINCT nationality ORDER BY nationality)
        FROM players 
        WHERE nationality IS NOT NULL
      ),
      ''primaryPositions'', (
        SELECT json_agg(DISTINCT primary_position ORDER BY 
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
          END
        )
        FROM players 
        WHERE primary_position IS NOT NULL
      ),
      ''secondaryPositions'', (
        SELECT json_agg(DISTINCT position ORDER BY 
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
          END
        )
        FROM (
          SELECT unnest(secondary_positions) as position
          FROM players
          WHERE secondary_positions IS NOT NULL
        ) t
      ),
      ''bestPositions'', (
        SELECT json_agg(DISTINCT best_position ORDER BY 
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
          END
        )
        FROM players 
        WHERE best_position IS NOT NULL
      ),
      ''preferredFoot'', (
        SELECT json_agg(DISTINCT preferred_foot ORDER BY preferred_foot)
        FROM players 
        WHERE preferred_foot IS NOT NULL
      )
    )
  ' INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_filter_options_paginated(option_type text, page_size integer DEFAULT 50, offset_value integer DEFAULT 0, search_term text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  CASE option_type
    WHEN 'nationalities' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(nationality ORDER BY nationality),
          ''hasMore'', (SELECT COUNT(DISTINCT nationality) FROM players WHERE nationality IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND nationality ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT nationality
          FROM players 
          WHERE nationality IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND nationality ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ' ORDER BY nationality
          LIMIT $1 OFFSET $2
        ) t';
    
    WHEN 'owners' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(owner_name ORDER BY owner_name),
          ''hasMore'', (SELECT COUNT(DISTINCT owner_name) FROM players WHERE owner_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND owner_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT owner_name
          FROM players 
          WHERE owner_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND owner_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ' ORDER BY owner_name
          LIMIT $1 OFFSET $2
        ) t';
    
    WHEN 'clubs' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(club_name ORDER BY club_name),
          ''hasMore'', (SELECT COUNT(DISTINCT club_name) FROM players WHERE club_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND club_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT club_name
          FROM players 
          WHERE club_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND club_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ' ORDER BY club_name
          LIMIT $1 OFFSET $2
        ) t';
    
    WHEN 'tags' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(tag ORDER BY tag),
          ''hasMore'', (SELECT COUNT(DISTINCT tag) FROM (SELECT unnest(tags) as tag FROM favourites WHERE tags IS NOT NULL) t WHERE tag IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND tag ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT tag
          FROM (
            SELECT unnest(tags) as tag
            FROM favourites
            WHERE tags IS NOT NULL
          ) t
          WHERE tag IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND tag ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ' ORDER BY tag
          LIMIT $1 OFFSET $2
        ) t';
    
    ELSE
      RAISE EXCEPTION 'Invalid option_type: %', option_type;
  END CASE;
  
  EXECUTE query_text INTO result USING page_size, offset_value;
  
  RETURN result;
END;
$function$
;


