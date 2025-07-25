set check_function_bodies = off;

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
          ''items'', json_agg(nationality),
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
          ''items'', json_agg(owner_name),
          ''hasMore'', (SELECT COUNT(DISTINCT owner_name) FROM players WHERE owner_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND owner_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT owner_name, owner_name_lower
          FROM players 
          WHERE owner_name IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND owner_name ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ' ORDER BY owner_name_lower
          LIMIT $1 OFFSET $2
        ) t';
    
    WHEN 'clubs' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(club_name),
          ''hasMore'', (SELECT COUNT(DISTINCT 
            CASE 
              WHEN club_name IS NULL THEN ''Free Agent''
              ELSE club_name 
            END
          ) FROM players' ||
          CASE WHEN search_term IS NOT NULL THEN ' WHERE (club_name ILIKE ''%' || search_term || '%'' OR (club_name IS NULL AND ''Free Agent'' ILIKE ''%' || search_term || '%''))' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT 
            CASE 
              WHEN club_name IS NULL THEN ''Free Agent''
              ELSE club_name 
            END as club_name,
            CASE 
              WHEN club_name IS NULL THEN ''free agent''
              ELSE club_name_lower 
            END as club_name_sort
          FROM players' ||
          CASE WHEN search_term IS NOT NULL THEN ' WHERE (club_name ILIKE ''%' || search_term || '%'' OR (club_name IS NULL AND ''Free Agent'' ILIKE ''%' || search_term || '%''))' ELSE '' END ||
          ' ORDER BY club_name_sort
          LIMIT $1 OFFSET $2
        ) t';
    
    WHEN 'tags' THEN
      query_text := '
        SELECT json_build_object(
          ''items'', json_agg(tag),
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


