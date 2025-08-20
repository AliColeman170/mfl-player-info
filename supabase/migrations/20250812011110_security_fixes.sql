set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_contract_stats_for_player(player_id integer, age_min integer DEFAULT NULL::integer, age_max integer DEFAULT NULL::integer, overall_min integer DEFAULT NULL::integer, overall_max integer DEFAULT NULL::integer, position_filter text DEFAULT NULL::text)
 RETURNS TABLE(division integer, total_contracts bigint, min_revenue_share integer, max_revenue_share integer, avg_revenue_share numeric)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  target_age INTEGER;
  target_overall INTEGER;
  target_position TEXT;
BEGIN
  -- Get the target player's stats
  SELECT age, overall, primary_position 
  INTO target_age, target_overall, target_position
  FROM public.players 
  WHERE id = player_id;
  
  -- Use provided parameters or calculate ranges based on target player
  age_min := COALESCE(age_min, GREATEST(16, target_age - 1));
  age_max := COALESCE(age_max, LEAST(40, target_age + 1));
  overall_min := COALESCE(overall_min, GREATEST(0, target_overall - 2));
  overall_max := COALESCE(overall_max, LEAST(99, target_overall + 2));
  position_filter := COALESCE(position_filter, target_position);
  
  RETURN QUERY
  SELECT 
    p.club_division as division,
    COUNT(*) as total_contracts,
    MIN(p.revenue_share) as min_revenue_share,
    MAX(p.revenue_share) as max_revenue_share,
    ROUND(AVG(p.revenue_share), 2) as avg_revenue_share
  FROM public.players p
  WHERE 
    p.revenue_share IS NOT NULL 
    AND p.revenue_share > 0
    AND p.club_division IS NOT NULL
    AND p.age BETWEEN age_min AND age_max
    AND p.overall BETWEEN overall_min AND overall_max
    AND (position_filter IS NULL OR p.primary_position = position_filter)
    AND p.contract_status = 'ACTIVE'
  GROUP BY p.club_division
  HAVING COUNT(*) > 0
  ORDER BY p.club_division;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_filter_counts(search_text text DEFAULT NULL::text, favourites_filter text DEFAULT 'all'::text, status_filter text[] DEFAULT '{}'::text[], selected_tags text[] DEFAULT '{}'::text[], tags_match_all boolean DEFAULT false, authenticated_wallet_address text DEFAULT NULL::text, wallet_address_filter text DEFAULT NULL::text, applied_nationalities text[] DEFAULT '{}'::text[], applied_positions text[] DEFAULT '{}'::text[], applied_secondary_positions text[] DEFAULT '{}'::text[], applied_owners text[] DEFAULT '{}'::text[], applied_clubs text[] DEFAULT '{}'::text[], applied_best_positions text[] DEFAULT '{}'::text[], applied_preferred_foot text DEFAULT NULL::text, age_min_filter integer DEFAULT NULL::integer, age_max_filter integer DEFAULT NULL::integer, height_min_filter integer DEFAULT NULL::integer, height_max_filter integer DEFAULT NULL::integer, overall_min_filter integer DEFAULT NULL::integer, overall_max_filter integer DEFAULT NULL::integer, pace_min_filter integer DEFAULT NULL::integer, pace_max_filter integer DEFAULT NULL::integer, shooting_min_filter integer DEFAULT NULL::integer, shooting_max_filter integer DEFAULT NULL::integer, passing_min_filter integer DEFAULT NULL::integer, passing_max_filter integer DEFAULT NULL::integer, dribbling_min_filter integer DEFAULT NULL::integer, dribbling_max_filter integer DEFAULT NULL::integer, defense_min_filter integer DEFAULT NULL::integer, defense_max_filter integer DEFAULT NULL::integer, physical_min_filter integer DEFAULT NULL::integer, physical_max_filter integer DEFAULT NULL::integer, best_overall_min_filter integer DEFAULT NULL::integer, best_overall_max_filter integer DEFAULT NULL::integer, market_value_min_filter integer DEFAULT NULL::integer, market_value_max_filter integer DEFAULT NULL::integer, price_diff_min_filter integer DEFAULT NULL::integer, price_diff_max_filter integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  base_query TEXT;
  result JSON;
  has_wallet BOOLEAN;
BEGIN
  -- Check if we have an authenticated wallet address for favourites/tags
  has_wallet := authenticated_wallet_address IS NOT NULL AND authenticated_wallet_address != '';
  
  -- Build base WHERE clause for filtering (no favourites join for non-authenticated users)
  IF has_wallet THEN
    base_query := '
      FROM public.players p
      LEFT JOIN public.favourites f ON p.id = f.player_id AND f.wallet_address = ''' || replace(authenticated_wallet_address, '''', '''''') || '''
      WHERE 1=1
    ';
  ELSE
    base_query := '
      FROM public.players p
      WHERE 1=1
    ';
  END IF;
  
  -- Add search filter (safe - no user input)
  IF search_text IS NOT NULL AND search_text != '' THEN
    base_query := base_query || ' AND p.search_text ILIKE ''%' || replace(search_text, '''', '''''') || '%''';
  END IF;
  
  -- Add favourites filter (only if authenticated)
  IF has_wallet THEN
    IF favourites_filter = 'favourites' THEN
      base_query := base_query || ' AND f.is_favourite = true';
    ELSIF favourites_filter = 'non-favourites' THEN
      base_query := base_query || ' AND (f.is_favourite = false OR f.is_favourite IS NULL)';
    END IF;
    
    -- Add tags filter (only if authenticated)
    IF array_length(selected_tags, 1) > 0 THEN
      IF tags_match_all THEN
        base_query := base_query || ' AND f.tags @> ARRAY[''' || array_to_string(selected_tags, ''',''') || ''']::text[]';
      ELSE
        base_query := base_query || ' AND f.tags && ARRAY[''' || array_to_string(selected_tags, ''',''') || ''']::text[]';
      END IF;
    END IF;
  END IF;
  
  -- Add status filter
  IF array_length(status_filter, 1) > 0 THEN
    base_query := base_query || ' AND (';
    
    -- Build OR conditions for selected statuses
    IF 'available' = ANY(status_filter) THEN
      base_query := base_query || '(p.is_retired = false AND p.is_burned = false)';
      -- Add OR if there are more conditions
      IF 'retired' = ANY(status_filter) OR 'burned' = ANY(status_filter) THEN
        base_query := base_query || ' OR ';
      END IF;
    END IF;
    
    IF 'retired' = ANY(status_filter) THEN
      base_query := base_query || 'p.is_retired = true';
      -- Add OR if burned is also selected
      IF 'burned' = ANY(status_filter) THEN
        base_query := base_query || ' OR ';
      END IF;
    END IF;
    
    IF 'burned' = ANY(status_filter) THEN
      base_query := base_query || 'p.is_burned = true';
    END IF;
    
    base_query := base_query || ')';
  END IF;
  
  -- Add wallet address filter
  IF wallet_address_filter IS NOT NULL AND wallet_address_filter != '' THEN
    base_query := base_query || ' AND p.owner_wallet_address = ''' || replace(wallet_address_filter, '''', '''''') || '''';
  END IF;
  
  -- Add applied multi-select filters with proper escaping
  IF array_length(applied_nationalities, 1) > 0 THEN
    base_query := base_query || ' AND p.nationality = ANY(ARRAY[''' || array_to_string(applied_nationalities, ''',''') || '''])';
  END IF;
  IF array_length(applied_positions, 1) > 0 THEN
    base_query := base_query || ' AND p.primary_position = ANY(ARRAY[''' || array_to_string(applied_positions, ''',''') || '''])';
  END IF;
  IF array_length(applied_secondary_positions, 1) > 0 THEN
    base_query := base_query || ' AND p.secondary_positions && ARRAY[''' || array_to_string(applied_secondary_positions, ''',''') || ''']';
  END IF;
  IF array_length(applied_owners, 1) > 0 THEN
    base_query := base_query || ' AND p.owner_name = ANY(ARRAY[''' || array_to_string(applied_owners, ''',''') || '''])';
  END IF;
  IF array_length(applied_clubs, 1) > 0 THEN
    base_query := base_query || ' AND (';
    -- Handle Free Agent case
    IF 'Free Agent' = ANY(applied_clubs) THEN
      base_query := base_query || 'p.club_name IS NULL';
      -- If there are other clubs selected too
      IF array_length(array_remove(applied_clubs, 'Free Agent'), 1) > 0 THEN
        base_query := base_query || ' OR p.club_name = ANY(ARRAY[''' || array_to_string(array_remove(applied_clubs, 'Free Agent'), ''',''') || '''])';
      END IF;
    ELSE
      base_query := base_query || 'p.club_name = ANY(ARRAY[''' || array_to_string(applied_clubs, ''',''') || '''])';
    END IF;
    base_query := base_query || ')';
  END IF;
  IF array_length(applied_best_positions, 1) > 0 THEN
    base_query := base_query || ' AND p.best_position = ANY(ARRAY[''' || array_to_string(applied_best_positions, ''',''') || '''])';
  END IF;
  IF applied_preferred_foot IS NOT NULL AND applied_preferred_foot != '' THEN
    base_query := base_query || ' AND p.preferred_foot = ''' || replace(applied_preferred_foot, '''', '''''') || '''';
  END IF;
  
  -- Add range filters
  IF age_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.age >= ' || age_min_filter;
  END IF;
  IF age_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.age <= ' || age_max_filter;
  END IF;
  IF height_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.height >= ' || height_min_filter;
  END IF;
  IF height_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.height <= ' || height_max_filter;
  END IF;
  IF overall_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.overall >= ' || overall_min_filter;
  END IF;
  IF overall_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.overall <= ' || overall_max_filter;
  END IF;
  IF pace_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.pace >= ' || pace_min_filter;
  END IF;
  IF pace_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.pace <= ' || pace_max_filter;
  END IF;
  IF shooting_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.shooting >= ' || shooting_min_filter;
  END IF;
  IF shooting_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.shooting <= ' || shooting_max_filter;
  END IF;
  IF passing_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.passing >= ' || passing_min_filter;
  END IF;
  IF passing_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.passing <= ' || passing_max_filter;
  END IF;
  IF dribbling_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.dribbling >= ' || dribbling_min_filter;
  END IF;
  IF dribbling_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.dribbling <= ' || dribbling_max_filter;
  END IF;
  IF defense_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.defense >= ' || defense_min_filter;
  END IF;
  IF defense_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.defense <= ' || defense_max_filter;
  END IF;
  IF physical_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.physical >= ' || physical_min_filter;
  END IF;
  IF physical_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.physical <= ' || physical_max_filter;
  END IF;
  IF best_overall_min_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.best_ovr >= ' || best_overall_min_filter;
  END IF;
  IF best_overall_max_filter IS NOT NULL THEN
    base_query := base_query || ' AND p.best_ovr <= ' || best_overall_max_filter;
  END IF;
  
  -- Execute dynamic queries to get counts for each filter type
  EXECUTE '
    SELECT json_build_object(
      ''nationalities'', (
        SELECT json_object_agg(nationality, count)
        FROM (
          SELECT p.nationality, COUNT(*) as count
          ' || base_query || '
          AND p.nationality IS NOT NULL
          GROUP BY nationality
          ORDER BY count DESC, nationality
        ) t
      ),
      ''primaryPositions'', (
        SELECT json_object_agg(position, count)
        FROM (
          SELECT p.primary_position as position, COUNT(*) as count
          ' || base_query || '
          GROUP BY position
          ORDER BY count DESC, position
        ) t
      ),
      ''secondaryPositions'', (
        SELECT json_object_agg(position, count)
        FROM (
          SELECT unnest(p.secondary_positions) as position, COUNT(*) as count
          ' || base_query || '
          GROUP BY position
          ORDER BY count DESC, position
        ) t
      ),
      ''owners'', (
        SELECT json_object_agg(owner, count)
        FROM (
          SELECT p.owner_name as owner, COUNT(*) as count
          ' || base_query || '
          AND p.owner_name IS NOT NULL
          GROUP BY owner, p.owner_name_lower
          ORDER BY count DESC, p.owner_name_lower
        ) t
      ),
      ''clubs'', (
        SELECT json_object_agg(club, count)
        FROM (
          SELECT 
            CASE 
              WHEN p.club_name IS NULL THEN ''Free Agent''
              ELSE p.club_name 
            END as club, 
            COUNT(*) as count
          ' || base_query || '
          GROUP BY 
            CASE 
              WHEN p.club_name IS NULL THEN ''Free Agent''
              ELSE p.club_name 
            END,
            CASE 
              WHEN p.club_name IS NULL THEN ''free agent''
              ELSE p.club_name_lower 
            END
          ORDER BY count DESC, 
            CASE 
              WHEN p.club_name IS NULL THEN ''free agent''
              ELSE p.club_name_lower 
            END
        ) t
      ),
      ''bestPositions'', (
        SELECT json_object_agg(position, count)
        FROM (
          SELECT p.best_position as position, COUNT(*) as count
          ' || base_query || '
          AND p.best_position IS NOT NULL
          GROUP BY position
          ORDER BY count DESC, position
        ) t
      ),
      ''preferredFoot'', (
        SELECT json_object_agg(foot, count)
        FROM (
          SELECT p.preferred_foot as foot, COUNT(*) as count
          ' || base_query || '
          GROUP BY foot
          ORDER BY count DESC, foot
        ) t
      ),
      ''status'', (
        SELECT json_object_agg(status, count)
        FROM (
          SELECT 
            CASE 
              WHEN p.is_burned = true THEN ''burned''
              WHEN p.is_retired = true THEN ''retired''
              ELSE ''available''
            END as status,
            COUNT(*) as count
          ' || base_query || '
          GROUP BY 
            CASE 
              WHEN p.is_burned = true THEN ''burned''
              WHEN p.is_retired = true THEN ''retired''
              ELSE ''available''
            END
          ORDER BY count DESC
        ) t
      )' || 
      CASE WHEN has_wallet THEN
      ',
      ''favourites'', (
        SELECT json_object_agg(favourite_status, count)
        FROM (
          SELECT 
            CASE 
              WHEN f.is_favourite = true THEN ''favourites''
              ELSE ''non-favourites''
            END as favourite_status,
            COUNT(*) as count
          ' || base_query || '
          GROUP BY 
            CASE 
              WHEN f.is_favourite = true THEN ''favourites''
              ELSE ''non-favourites''
            END
          ORDER BY count DESC
        ) t
      ),
      ''tags'', (
        SELECT json_object_agg(tag, count)
        FROM (
          SELECT unnest(f.tags) as tag, COUNT(*) as count
          ' || base_query || '
          AND f.tags IS NOT NULL
          GROUP BY tag
          ORDER BY count DESC, tag
          LIMIT 100
        ) t
      )' ELSE '' END ||
    ')
  ' INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_filter_options()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
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
          FROM public.players 
          WHERE nationality IS NOT NULL
          ORDER BY nationality
        ) t
      ),
      ''owners'', (
        SELECT json_agg(owner_name ORDER BY owner_name_lower)
        FROM (
          SELECT DISTINCT owner_name, owner_name_lower
          FROM public.players 
          WHERE owner_name IS NOT NULL
          ORDER BY owner_name_lower
        ) t
      ),
      ''clubs'', (
        SELECT json_agg(club_name ORDER BY club_name_sort)
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
          FROM public.players 
          ORDER BY club_name_sort
        ) t
      ),
      ''tags'', (
        SELECT json_agg(tag ORDER BY tag)
        FROM (
          SELECT DISTINCT unnest(tags) as tag
          FROM public.favourites
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
          FROM public.players 
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
            FROM public.players
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
          FROM public.players 
          WHERE best_position IS NOT NULL
          ORDER BY position_order
        ) t
      ),
      ''preferredFoot'', (
        SELECT json_agg(preferred_foot ORDER BY preferred_foot)
        FROM (
          SELECT DISTINCT preferred_foot
          FROM public.players 
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

CREATE OR REPLACE FUNCTION public.get_filter_options_paginated(option_type text, page_size integer DEFAULT 50, offset_value integer DEFAULT 0, search_term text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
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
          ''hasMore'', (SELECT COUNT(DISTINCT nationality) FROM public.players WHERE nationality IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND nationality ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT nationality
          FROM public.players 
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
          FROM public.players 
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
          ''hasMore'', (SELECT COUNT(DISTINCT tag) FROM (SELECT unnest(tags) as tag FROM public.favourites WHERE tags IS NOT NULL) t WHERE tag IS NOT NULL' ||
          CASE WHEN search_term IS NOT NULL THEN ' AND tag ILIKE ''%' || search_term || '%''' ELSE '' END ||
          ') > $1 + $2
        )
        FROM (
          SELECT DISTINCT tag
          FROM (
            SELECT unnest(tags) as tag
            FROM public.favourites
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

CREATE OR REPLACE FUNCTION public.get_total_sales_volume()
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  total_volume BIGINT;
BEGIN
  SELECT COALESCE(SUM(price), 0) INTO total_volume FROM public.sales;
  RETURN total_volume;
END;
$function$
;


