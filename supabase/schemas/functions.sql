-- RPC function to get contract statistics for similar players
CREATE OR REPLACE FUNCTION get_contract_stats_for_player (
  player_id INTEGER,
  age_min INTEGER DEFAULT NULL,
  age_max INTEGER DEFAULT NULL,
  overall_min INTEGER DEFAULT NULL,
  overall_max INTEGER DEFAULT NULL,
  position_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  division INTEGER,
  total_contracts BIGINT,
  min_revenue_share INTEGER,
  max_revenue_share INTEGER,
  avg_revenue_share NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  target_age INTEGER;
  target_overall INTEGER;
  target_position TEXT;
BEGIN
  -- Get the target player's stats
  SELECT age, overall, primary_position 
  INTO target_age, target_overall, target_position
  FROM players 
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
  FROM players p
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
$$;

-- RPC function to get dynamic filter option counts based on current filters
CREATE OR REPLACE FUNCTION get_filter_counts (
  -- Search filters
  search_text TEXT DEFAULT NULL,
  favourites_filter TEXT DEFAULT 'all',
  status_filter TEXT[] DEFAULT '{}',
  selected_tags TEXT[] DEFAULT '{}',
  tags_match_all BOOLEAN DEFAULT FALSE,
  authenticated_wallet_address TEXT DEFAULT NULL,
  wallet_address_filter TEXT DEFAULT NULL,
  -- Applied filters (these will be included in the base query to narrow results)
  applied_nationalities TEXT[] DEFAULT '{}',
  applied_positions TEXT[] DEFAULT '{}',
  applied_secondary_positions TEXT[] DEFAULT '{}',
  applied_owners TEXT[] DEFAULT '{}',
  applied_clubs TEXT[] DEFAULT '{}',
  applied_best_positions TEXT[] DEFAULT '{}',
  applied_preferred_foot TEXT DEFAULT NULL,
  -- Range filters
  age_min_filter INTEGER DEFAULT NULL,
  age_max_filter INTEGER DEFAULT NULL,
  height_min_filter INTEGER DEFAULT NULL,
  height_max_filter INTEGER DEFAULT NULL,
  overall_min_filter INTEGER DEFAULT NULL,
  overall_max_filter INTEGER DEFAULT NULL,
  pace_min_filter INTEGER DEFAULT NULL,
  pace_max_filter INTEGER DEFAULT NULL,
  shooting_min_filter INTEGER DEFAULT NULL,
  shooting_max_filter INTEGER DEFAULT NULL,
  passing_min_filter INTEGER DEFAULT NULL,
  passing_max_filter INTEGER DEFAULT NULL,
  dribbling_min_filter INTEGER DEFAULT NULL,
  dribbling_max_filter INTEGER DEFAULT NULL,
  defense_min_filter INTEGER DEFAULT NULL,
  defense_max_filter INTEGER DEFAULT NULL,
  physical_min_filter INTEGER DEFAULT NULL,
  physical_max_filter INTEGER DEFAULT NULL,
  best_overall_min_filter INTEGER DEFAULT NULL,
  best_overall_max_filter INTEGER DEFAULT NULL,
  market_value_min_filter INTEGER DEFAULT NULL,
  market_value_max_filter INTEGER DEFAULT NULL,
  price_diff_min_filter INTEGER DEFAULT NULL,
  price_diff_max_filter INTEGER DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql AS $$
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
      FROM players p
      LEFT JOIN favourites f ON p.id = f.player_id AND f.wallet_address = ''' || replace(authenticated_wallet_address, '''', '''''') || '''
      WHERE 1=1
    ';
  ELSE
    base_query := '
      FROM players p
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
$$;

-- RPC function to get paginated filter options
CREATE OR REPLACE FUNCTION get_filter_options_paginated (
  option_type TEXT,
  page_size INTEGER DEFAULT 50,
  offset_value INTEGER DEFAULT 0,
  search_term TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql AS $$
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
$$;

-- RPC function to get all possible filter options (for small lists like positions)
CREATE OR REPLACE FUNCTION get_filter_options () RETURNS JSON LANGUAGE plpgsql AS $$
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
        SELECT json_agg(owner_name ORDER BY owner_name_lower)
        FROM (
          SELECT DISTINCT owner_name, owner_name_lower
          FROM players 
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
          FROM players 
          ORDER BY club_name_sort
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
$$;

-- Function to get top owners by player count
CREATE OR REPLACE FUNCTION get_top_owners (limit_count INTEGER DEFAULT 5) RETURNS TABLE (
  owner_wallet_address TEXT,
  owner_name TEXT,
  player_count INTEGER,
  total_value INTEGER,
  avg_overall INTEGER
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.owner_wallet_address::TEXT,
    p.owner_name::TEXT,
    COUNT(*)::INTEGER as player_count,
    COALESCE(SUM(p.market_value_estimate), 0)::INTEGER as total_value,
    ROUND(AVG(p.overall), 0)::INTEGER as avg_overall
  FROM public.players p
  WHERE 
    p.owner_wallet_address IS NOT NULL
    AND p.market_value_estimate IS NOT NULL
    AND p.overall IS NOT NULL
    AND p.owner_wallet_address != '0xff8d2bbed8164db0'
    AND p.owner_wallet_address != '0x6fec8986261ecf49'
  GROUP BY p.owner_wallet_address, p.owner_name
  ORDER BY player_count DESC
  LIMIT limit_count;
END;
$$;

-- Function to get most favorited players
CREATE OR REPLACE FUNCTION get_favorite_players (limit_count INTEGER DEFAULT 5) RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  overall INTEGER,
  primary_position TEXT,
  market_value_estimate INTEGER,
  age INTEGER,
  club_name TEXT,
  favorite_count INTEGER
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.overall,
    p.primary_position::TEXT,
    p.market_value_estimate,
    p.age,
    p.club_name::TEXT,
    COUNT(f.player_id)::INTEGER as favorite_count
  FROM public.players p
  INNER JOIN public.favourites f ON p.id = f.player_id
  WHERE f.is_favourite = true
  GROUP BY p.id, p.first_name, p.last_name, p.overall, p.primary_position, p.market_value_estimate, p.age, p.club_name
  ORDER BY favorite_count DESC
  LIMIT limit_count;
END;
$$;