alter role anon
set
  statement_timeout = '30s';

alter role authenticated
set
  statement_timeout = '30s';

alter role service_role
set
  statement_timeout = '5min';

-- RPC function to get total sales volume across all sales
CREATE OR REPLACE FUNCTION get_total_sales_volume () RETURNS BIGINT LANGUAGE plpgsql
SET
  search_path = '' AS $$
DECLARE
  total_volume BIGINT;
BEGIN
  SELECT COALESCE(SUM(price), 0) INTO total_volume FROM public.sales;
  RETURN total_volume;
END;
$$;

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
) LANGUAGE plpgsql
SET
  search_path = '' AS $$
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
) RETURNS JSON LANGUAGE plpgsql
SET
  search_path = '' AS $$
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
$$;

-- RPC function to get paginated filter options
CREATE OR REPLACE FUNCTION get_filter_options_paginated (
  option_type TEXT,
  page_size INTEGER DEFAULT 50,
  offset_value INTEGER DEFAULT 0,
  search_term TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql
SET
  search_path = '' AS $$
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
$$;

-- RPC function to get all possible filter options (for small lists like positions)
CREATE OR REPLACE FUNCTION get_filter_options () RETURNS JSON LANGUAGE plpgsql
SET
  search_path = '' AS $$
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

-- Function to get sales data for price vs overall rating graph
CREATE OR REPLACE FUNCTION get_sales_price_vs_overall_graph (days_back INTEGER DEFAULT 365) RETURNS TABLE (
  overall_rating INTEGER,
  avg_price NUMERIC,
  sale_count BIGINT,
  min_price INTEGER,
  max_price INTEGER,
  trimmed_avg_price NUMERIC,
  trimmed_sale_count BIGINT
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT 
      COALESCE(s.player_overall, p.overall) as rating,
      s.price,
      s.listing_resource_id
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      -- Use purchase_date_time converted from epoch timestamp, fallback to created_date_time
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND COALESCE(s.player_overall, p.overall) IS NOT NULL
      AND COALESCE(s.player_overall, p.overall) BETWEEN 40 AND 99  -- Filter out unrealistic ratings
  ),
  rating_percentiles AS (
    SELECT 
      rating,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY price) as p5,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) as p95
    FROM filtered_sales
    GROUP BY rating
  ),
  trimmed_sales AS (
    SELECT 
      fs.rating,
      fs.price,
      fs.listing_resource_id
    FROM filtered_sales fs
    INNER JOIN rating_percentiles rp ON fs.rating = rp.rating
    WHERE fs.price BETWEEN rp.p5 AND rp.p95  -- Remove top and bottom 5%
  )
  SELECT 
    fs.rating as overall_rating,
    ROUND(AVG(fs.price), 2) as avg_price,
    COUNT(fs.listing_resource_id) as sale_count,
    MIN(fs.price) as min_price,
    MAX(fs.price) as max_price,
    ROUND(AVG(ts.price), 2) as trimmed_avg_price,
    COUNT(ts.listing_resource_id) as trimmed_sale_count
  FROM filtered_sales fs
  LEFT JOIN trimmed_sales ts ON fs.rating = ts.rating
  GROUP BY fs.rating
  HAVING COUNT(fs.listing_resource_id) >= 20  -- Require at least 20 sales for meaningful percentile calculation
  ORDER BY fs.rating;
END;
$$;

-- Function to calculate base player value using exponential pricing formula
CREATE OR REPLACE FUNCTION calculate_base_player_value (player_overall INTEGER) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE
set
  search_path = '' AS $$
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
$$;

-- Function to update all players with calculated base values
CREATE OR REPLACE FUNCTION update_all_player_base_values () RETURNS INTEGER LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
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
$$;

-- Function to get sales data for price vs age graph
CREATE OR REPLACE FUNCTION get_sales_price_vs_age_graph (days_back INTEGER DEFAULT 90) RETURNS TABLE (
  player_age INTEGER,
  avg_price NUMERIC,
  sale_count BIGINT,
  min_price INTEGER,
  max_price INTEGER,
  trimmed_avg_price NUMERIC,
  trimmed_sale_count BIGINT
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT 
      COALESCE(s.player_age, p.age) as age,
      s.price,
      s.listing_resource_id
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      -- Use purchase_date_time converted from epoch timestamp, fallback to created_date_time
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND COALESCE(s.player_age, p.age) IS NOT NULL
      AND COALESCE(s.player_age, p.age) BETWEEN 16 AND 40  -- Realistic age range for football players
  ),
  age_percentiles AS (
    SELECT 
      age,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY price) as p5,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) as p95
    FROM filtered_sales
    GROUP BY age
  ),
  trimmed_sales AS (
    SELECT 
      fs.age,
      fs.price,
      fs.listing_resource_id
    FROM filtered_sales fs
    INNER JOIN age_percentiles ap ON fs.age = ap.age
    WHERE fs.price BETWEEN ap.p5 AND ap.p95  -- Remove top and bottom 5%
  )
  SELECT 
    fs.age as player_age,
    ROUND(AVG(fs.price), 2) as avg_price,
    COUNT(fs.listing_resource_id) as sale_count,
    MIN(fs.price) as min_price,
    MAX(fs.price) as max_price,
    ROUND(AVG(ts.price), 2) as trimmed_avg_price,
    COUNT(ts.listing_resource_id) as trimmed_sale_count
  FROM filtered_sales fs
  LEFT JOIN trimmed_sales ts ON fs.age = ts.age
  GROUP BY fs.age
  HAVING COUNT(fs.listing_resource_id) >= 100  -- Require at least 100 sales for statistical relevance
  ORDER BY fs.age;
END;
$$;

-- Function to get sales data for price vs position graph
CREATE OR REPLACE FUNCTION get_sales_price_vs_position_graph (days_back INTEGER DEFAULT 90) RETURNS TABLE (
  player_position TEXT,
  avg_price NUMERIC,
  sale_count BIGINT,
  min_price INTEGER,
  max_price INTEGER,
  trimmed_avg_price NUMERIC,
  trimmed_sale_count BIGINT,
  position_order INTEGER
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT 
      COALESCE(s.player_position, p.primary_position) as position,
      s.price,
      s.listing_resource_id
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      -- Use purchase_date_time converted from epoch timestamp, fallback to created_date_time
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND COALESCE(s.player_position, p.primary_position) IS NOT NULL
  ),
  position_percentiles AS (
    SELECT 
      position,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY price) as p5,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) as p95
    FROM filtered_sales
    GROUP BY position
  ),
  trimmed_sales AS (
    SELECT 
      fs.position,
      fs.price,
      fs.listing_resource_id
    FROM filtered_sales fs
    INNER JOIN position_percentiles pp ON fs.position = pp.position
    WHERE fs.price BETWEEN pp.p5 AND pp.p95  -- Remove top and bottom 5%
  )
  SELECT 
    fs.position as player_position,
    ROUND(AVG(fs.price), 2) as avg_price,
    COUNT(fs.listing_resource_id) as sale_count,
    MIN(fs.price) as min_price,
    MAX(fs.price) as max_price,
    ROUND(AVG(ts.price), 2) as trimmed_avg_price,
    COUNT(ts.listing_resource_id) as trimmed_sale_count,
    -- Position ordering for consistent display (attacking to defensive)
    CASE fs.position
      WHEN 'ST' THEN 1
      WHEN 'CF' THEN 2
      WHEN 'LW' THEN 3
      WHEN 'RW' THEN 4
      WHEN 'CAM' THEN 5
      WHEN 'LM' THEN 6
      WHEN 'RM' THEN 7
      WHEN 'CM' THEN 8
      WHEN 'CDM' THEN 9
      WHEN 'LWB' THEN 10
      WHEN 'RWB' THEN 11
      WHEN 'LB' THEN 12
      WHEN 'RB' THEN 13
      WHEN 'CB' THEN 14
      WHEN 'GK' THEN 15
      ELSE 16
    END as position_order
  FROM filtered_sales fs
  LEFT JOIN trimmed_sales ts ON fs.position = ts.position
  GROUP BY fs.position
  HAVING COUNT(fs.listing_resource_id) >= 1000  -- Require at least 1000 sales for statistical relevance
  ORDER BY position_order;
END;
$$;

-- Function to analyze multi-variable relationships for pricing model development
CREATE OR REPLACE FUNCTION analyze_multi_variable_pricing (
  days_back INTEGER DEFAULT 90,
  min_sales INTEGER DEFAULT 50
) RETURNS TABLE (
  overall_rating INTEGER,
  player_age INTEGER,
  player_position TEXT,
  avg_price NUMERIC,
  trimmed_avg_price NUMERIC,
  sale_count BIGINT,
  base_value_estimate NUMERIC,
  position_premium NUMERIC,
  age_factor NUMERIC
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT 
      COALESCE(s.player_overall, p.overall) as rating,
      COALESCE(s.player_age, p.age) as age,
      COALESCE(s.player_position, p.primary_position) as position,
      s.price,
      s.listing_resource_id
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND COALESCE(s.player_overall, p.overall) IS NOT NULL
      AND COALESCE(s.player_age, p.age) IS NOT NULL
      AND COALESCE(s.player_position, p.primary_position) IS NOT NULL
      AND COALESCE(s.player_overall, p.overall) BETWEEN 40 AND 95
      AND COALESCE(s.player_age, p.age) BETWEEN 16 AND 35
  ),
  percentile_trimmed AS (
    SELECT 
      rating, age, position, price, listing_resource_id,
      PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY rating, age, position) as p5,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY rating, age, position) as p95
    FROM filtered_sales
  ),
  trimmed_sales AS (
    SELECT rating, age, position, price, listing_resource_id
    FROM percentile_trimmed
    WHERE price BETWEEN p5 AND p95
  ),
  position_baseline AS (
    SELECT 
      position,
      AVG(price) as position_avg_price
    FROM trimmed_sales
    GROUP BY position
  ),
  age_baseline AS (
    SELECT 
      age,
      AVG(price) as age_avg_price
    FROM trimmed_sales
    GROUP BY age
  )
  SELECT 
    fs.rating as overall_rating,
    fs.age as player_age,
    fs.position as player_position,
    ROUND(AVG(fs.price), 2) as avg_price,
    ROUND(AVG(ts.price), 2) as trimmed_avg_price,
    COUNT(fs.listing_resource_id) as sale_count,
    public.calculate_base_player_value(fs.rating) as base_value_estimate,
    ROUND(pb.position_avg_price / (SELECT AVG(position_avg_price) FROM position_baseline), 3) as position_premium,
    ROUND(ab.age_avg_price / (SELECT AVG(age_avg_price) FROM age_baseline), 3) as age_factor
  FROM filtered_sales fs
  LEFT JOIN trimmed_sales ts ON fs.rating = ts.rating AND fs.age = ts.age AND fs.position = ts.position
  LEFT JOIN position_baseline pb ON fs.position = pb.position
  LEFT JOIN age_baseline ab ON fs.age = ab.age
  GROUP BY fs.rating, fs.age, fs.position, pb.position_avg_price, ab.age_avg_price
  HAVING COUNT(fs.listing_resource_id) >= min_sales
  ORDER BY fs.rating, fs.age, fs.position;
END;
$$;

-- Comprehensive player pricing model function
CREATE OR REPLACE FUNCTION calculate_comprehensive_player_value (
  player_overall INTEGER,
  player_age INTEGER,
  player_position TEXT
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE
set
  search_path = '' AS $$
DECLARE
  base_value NUMERIC;
  market_multiplier NUMERIC;
  final_price NUMERIC;
  player_overall_range TEXT;
BEGIN
  -- Validate inputs
  IF player_overall IS NULL OR player_age IS NULL OR player_position IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF player_overall < 20 OR player_overall > 99 OR player_age < 16 OR player_age > 40 THEN
    RETURN NULL;
  END IF;
  
  -- Get base value from overall rating using our exponential formula
  base_value := public.calculate_base_player_value(player_overall);
  
  -- Determine overall range for market multiplier lookup
  player_overall_range := CASE
    WHEN player_overall >= 97 THEN '97-99'
    WHEN player_overall >= 94 THEN '94-96'
    WHEN player_overall >= 91 THEN '91-93'
    WHEN player_overall >= 88 THEN '88-90'
    WHEN player_overall >= 85 THEN '85-87'
    WHEN player_overall >= 82 THEN '82-84'
    WHEN player_overall >= 79 THEN '79-81'
    WHEN player_overall >= 76 THEN '76-78'
    WHEN player_overall >= 73 THEN '73-75'
    WHEN player_overall >= 70 THEN '70-72'
    WHEN player_overall >= 67 THEN '67-69'
    WHEN player_overall >= 64 THEN '64-66'
    WHEN player_overall >= 61 THEN '61-63'
    WHEN player_overall >= 58 THEN '58-60'
    WHEN player_overall >= 55 THEN '55-57'
    WHEN player_overall >= 52 THEN '52-54'
    WHEN player_overall >= 49 THEN '49-51'
    WHEN player_overall >= 46 THEN '46-48'
    WHEN player_overall >= 43 THEN '43-45'
    ELSE '40-42'
  END;
  
  -- Get market multiplier from market_multipliers table
  SELECT multiplier INTO market_multiplier
  FROM public.market_multipliers
  WHERE position = player_position
    AND age_range = player_age::TEXT
    AND overall_range = player_overall_range
  LIMIT 1;
  
  -- Fallback to average multiplier for position if specific combination not found
  IF market_multiplier IS NULL THEN
    SELECT AVG(multiplier) INTO market_multiplier
    FROM public.market_multipliers
    WHERE position = player_position
      AND overall_range = player_overall_range;
  END IF;
  
  -- Final fallback to hardcoded multipliers if no market data
  IF market_multiplier IS NULL THEN
    market_multiplier := CASE player_position
      WHEN 'LW' THEN 1.30   -- Updated based on recent analysis
      WHEN 'LM' THEN 1.25
      WHEN 'RW' THEN 1.20
      WHEN 'RM' THEN 1.15
      WHEN 'ST' THEN 1.10
      WHEN 'CM' THEN 1.05
      WHEN 'CAM' THEN 1.00
      WHEN 'CF' THEN 1.00
      WHEN 'CDM' THEN 0.95
      WHEN 'RB' THEN 0.95
      WHEN 'LB' THEN 0.90
      WHEN 'RWB' THEN 0.90
      WHEN 'LWB' THEN 0.90
      WHEN 'CB' THEN 0.85
      WHEN 'GK' THEN 0.70
      ELSE 1.00
    END;
  END IF;
  
  -- Calculate final price using market-based multiplier
  final_price := base_value * market_multiplier;
  
  -- Apply minimum price floor
  IF final_price < 1 THEN
    final_price := 1;
  END IF;
  
  RETURN ROUND(final_price, 2);
END;
$$;

-- Function to test pricing model accuracy against real sales data
CREATE OR REPLACE FUNCTION test_pricing_model_accuracy (
  days_back INTEGER DEFAULT 90,
  sample_size INTEGER DEFAULT 1000
) RETURNS TABLE (
  test_count BIGINT,
  avg_actual_price NUMERIC,
  avg_predicted_price NUMERIC,
  avg_absolute_error NUMERIC,
  avg_percentage_error NUMERIC,
  median_percentage_error NUMERIC,
  accuracy_within_10_percent NUMERIC,
  accuracy_within_20_percent NUMERIC,
  accuracy_within_30_percent NUMERIC
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
BEGIN
  RETURN QUERY
  WITH test_data AS (
    SELECT 
      COALESCE(s.player_overall, p.overall) as rating,
      COALESCE(s.player_age, p.age) as age,
      COALESCE(s.player_position, p.primary_position) as position,
      s.price as actual_price,
      public.calculate_comprehensive_player_value(
        COALESCE(s.player_overall, p.overall),
        COALESCE(s.player_age, p.age),
        COALESCE(s.player_position, p.primary_position)
      ) as predicted_price
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND s.price BETWEEN 1 AND 1000  -- Filter extreme outliers
      AND COALESCE(s.player_overall, p.overall) IS NOT NULL
      AND COALESCE(s.player_age, p.age) IS NOT NULL
      AND COALESCE(s.player_position, p.primary_position) IS NOT NULL
    ORDER BY RANDOM()
    LIMIT sample_size
  ),
  error_calculations AS (
    SELECT 
      actual_price,
      predicted_price,
      ABS(predicted_price - actual_price) as absolute_error,
      ABS(predicted_price - actual_price) / NULLIF(actual_price, 0) * 100 as percentage_error
    FROM test_data
    WHERE predicted_price IS NOT NULL
  )
  SELECT 
    COUNT(*) as test_count,
    ROUND(AVG(actual_price), 2) as avg_actual_price,
    ROUND(AVG(predicted_price), 2) as avg_predicted_price,
    ROUND(AVG(absolute_error), 2) as avg_absolute_error,
    ROUND(AVG(percentage_error), 2) as avg_percentage_error,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage_error)::NUMERIC, 2) as median_percentage_error,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 10)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_10_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 20)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_20_percent,
    ROUND(COUNT(*) FILTER (WHERE percentage_error <= 30)::NUMERIC / COUNT(*) * 100, 1) as accuracy_within_30_percent
  FROM error_calculations;
END;
$$;

-- Function to update a single player's market value estimates
CREATE OR REPLACE FUNCTION update_player_market_value (player_id BIGINT) RETURNS VOID LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
DECLARE
  player_record RECORD;
  base_estimate NUMERIC;
  comprehensive_estimate NUMERIC;
  low_estimate INTEGER;
  high_estimate INTEGER;
  confidence_level TEXT;
  estimation_method TEXT;
  actual_sample_count INTEGER;
  based_on_info TEXT;
  confidence_multiplier NUMERIC;
  days_back INTEGER := 90;
BEGIN
  -- Get player data
  SELECT 
    id, overall, age, primary_position, 
    first_name, last_name
  INTO player_record
  FROM public.players 
  WHERE id = player_id;
  
  -- Skip if player not found or missing required data
  IF NOT FOUND OR player_record.overall IS NULL THEN
    RETURN;
  END IF;
  
  -- Get actual sample count from sales data for similar players
  SELECT COUNT(*)::INTEGER INTO actual_sample_count
  FROM public.sales s
  INNER JOIN public.players p ON s.player_id = p.id
  WHERE 
    (CASE 
      WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
      THEN to_timestamp(s.purchase_date_time / 1000)
      ELSE to_timestamp(s.created_date_time / 1000)
    END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
    AND s.price > 0
    -- Match similar players (±2 rating, ±2 age, same position)
    AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 2
    AND (player_record.age IS NULL OR ABS(COALESCE(s.player_age, p.age) - player_record.age) <= 2)
    AND (player_record.primary_position IS NULL OR 
         COALESCE(s.player_position, p.primary_position) = player_record.primary_position);
  
  -- If no exact matches, try broader search (±5 rating, same position)
  IF actual_sample_count = 0 THEN
    SELECT COUNT(*)::INTEGER INTO actual_sample_count
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 5
      AND (player_record.primary_position IS NULL OR 
           COALESCE(s.player_position, p.primary_position) = player_record.primary_position);
  END IF;
  
  -- If still no matches, try rating range only
  IF actual_sample_count = 0 THEN
    SELECT COUNT(*)::INTEGER INTO actual_sample_count
    FROM public.sales s
    INNER JOIN public.players p ON s.player_id = p.id
    WHERE 
      (CASE 
        WHEN s.purchase_date_time IS NOT NULL AND s.purchase_date_time > 0 
        THEN to_timestamp(s.purchase_date_time / 1000)
        ELSE to_timestamp(s.created_date_time / 1000)
      END) >= (CURRENT_DATE - INTERVAL '1 day' * days_back)
      AND s.price > 0
      AND ABS(COALESCE(s.player_overall, p.overall) - player_record.overall) <= 10;
  END IF;
  
  -- Default to 0 if no sales found
  IF actual_sample_count IS NULL THEN
    actual_sample_count := 0;
  END IF;
  
  -- Calculate base estimate using our comprehensive model
  comprehensive_estimate := public.calculate_comprehensive_player_value(
    player_record.overall,
    player_record.age,
    player_record.primary_position
  );
  
  -- Use comprehensive estimate as primary estimate
  base_estimate := comprehensive_estimate;
  
  -- Calculate confidence based on actual sample size and model accuracy
  IF actual_sample_count >= 1000 THEN
    confidence_level := 'High';
    confidence_multiplier := 0.80; -- ±20% range
    estimation_method := 'Data-driven (High Sample)';
  ELSIF actual_sample_count >= 100 THEN
    confidence_level := 'Medium';
    confidence_multiplier := 0.70; -- ±30% range
    estimation_method := 'Data-driven (Medium Sample)';
  ELSIF actual_sample_count >= 10 THEN
    confidence_level := 'Low';
    confidence_multiplier := 0.60; -- ±40% range
    estimation_method := 'Data-driven (Low Sample)';
  ELSE
    -- No sales data, use model-based confidence
    IF player_record.overall >= 85 THEN
      confidence_level := 'Very Low';
      confidence_multiplier := 0.50; -- ±50% range
    ELSIF player_record.overall >= 50 THEN
      confidence_level := 'Low';
      confidence_multiplier := 0.65; -- ±35% range
    ELSE
      confidence_level := 'Medium';
      confidence_multiplier := 0.75; -- ±25% range
    END IF;
    estimation_method := 'Model-based (No Sales Data)';
  END IF;
  
  -- Calculate range based on confidence
  low_estimate := ROUND(base_estimate * confidence_multiplier);
  high_estimate := ROUND(base_estimate * (2.0 - confidence_multiplier));
  
  -- Ensure minimum values and logical ranges
  IF low_estimate < 1 THEN low_estimate := 1; END IF;
  IF high_estimate < low_estimate + 1 THEN high_estimate := low_estimate + 1; END IF;
  IF base_estimate < 1 THEN base_estimate := 1; END IF;
  
  -- Based on description
  based_on_info := 'Multi-variable model (Rating: ' || player_record.overall || 
                   CASE WHEN player_record.age IS NOT NULL THEN ', Age: ' || player_record.age ELSE '' END ||
                   CASE WHEN player_record.primary_position IS NOT NULL THEN ', Position: ' || player_record.primary_position ELSE '' END ||
                   ') - ' || actual_sample_count || ' similar sales';
  
  -- Update player record - update base_value_estimate first, then market values
  UPDATE public.players 
  SET 
    base_value_estimate = ROUND(base_estimate)::INTEGER,
    market_value_estimate = ROUND(base_estimate)::INTEGER,
    market_value_low = low_estimate,
    market_value_high = high_estimate,
    market_value_confidence = confidence_level,
    market_value_method = estimation_method,
    market_value_sample_size = actual_sample_count,
    market_value_based_on = based_on_info,
    market_value_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = player_id;
  
END;
$$;

-- Function to bulk update all players' market values (original slow version)
CREATE OR REPLACE FUNCTION update_all_players_market_values () RETURNS INTEGER LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
DECLARE
  updated_count INTEGER := 0;
  player_record RECORD;
BEGIN
  -- Process players in batches to avoid long-running transactions
  FOR player_record IN 
    SELECT id FROM public.players 
    WHERE overall IS NOT NULL 
    ORDER BY id
  LOOP
    PERFORM public.update_player_market_value(player_record.id);
    updated_count := updated_count + 1;
    
    -- Log progress every 10000 records
    IF updated_count % 10000 = 0 THEN
      RAISE NOTICE 'Updated % players market values', updated_count;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Trigger function to automatically update market value when player data changes
CREATE OR REPLACE FUNCTION trigger_update_player_market_value () RETURNS TRIGGER LANGUAGE plpgsql
set
  search_path = '' AS $$
BEGIN
  -- Only update if relevant fields changed or it's a new player
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (
       OLD.overall IS DISTINCT FROM NEW.overall OR
       OLD.age IS DISTINCT FROM NEW.age OR
       OLD.primary_position IS DISTINCT FROM NEW.primary_position OR
       OLD.market_value_estimate IS NULL OR
       OLD.base_value_estimate IS NULL
     )) THEN
    
    -- Update market value using our comprehensive function
    PERFORM public.update_player_market_value(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update sales summary data (simplified for reliability)
CREATE OR REPLACE FUNCTION update_sales_summary () RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
    pos VARCHAR(10);
    age_val INTEGER;
    overall_val INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Clear existing summary data
    DELETE FROM public.sales_summary WHERE id IS NOT NULL;
    
    -- Generate summary for common position/age/overall combinations
    FOR pos IN SELECT DISTINCT player_position FROM public.sales WHERE player_position IS NOT NULL
    LOOP
        FOR age_val IN SELECT generate_series(18, 38, 2) -- Every 2 years from 18-38
        LOOP
            FOR overall_val IN SELECT generate_series(45, 95, 5) -- Every 5 overall from 45-95
            LOOP
                -- Insert simplified summary data
                WITH sales_data AS (
                    SELECT 
                        s.price,
                        COALESCE(s.purchase_date_time, s.created_date_time) as sale_date,
                        ROW_NUMBER() OVER (ORDER BY COALESCE(s.purchase_date_time, s.created_date_time) DESC) as rn
                    FROM public.sales s
                    WHERE s.player_position = pos
                    AND s.player_age BETWEEN (age_val - 1) AND (age_val + 1)
                    AND s.player_overall BETWEEN (overall_val - 1) AND (overall_val + 1)
                    AND s.price > 0
                    AND s.status = 'BOUGHT'
                    -- Only recent sales (last 180 days for more current pricing)
                    AND COALESCE(s.purchase_date_time, s.created_date_time) >= EXTRACT(EPOCH FROM (NOW() - INTERVAL '180 days')) * 1000
                    -- Filter out obvious outliers (very low or very high prices)
                    AND s.price BETWEEN 1 AND 15000
                )
                INSERT INTO public.sales_summary (
                    position, age_center, overall_center, age_range, overall_range,
                    sample_count, avg_price, median_price, recent_sales_data, price_trend
                )
                SELECT 
                    pos,
                    age_val,
                    overall_val,
                    1, -- ±1 range  
                    1, -- ±1 range
                    COUNT(*),
                    ROUND(AVG(price)::NUMERIC, 2),
                    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)::NUMERIC, 2),
                    -- Store recent sales for EMA (last 50 sales, with dates)
                    COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'price', price,
                                'date', sale_date
                            ) 
                            ORDER BY sale_date DESC
                        ) FILTER (WHERE rn <= 50),
                        '[]'::jsonb
                    ),
                    0.0 -- Default price trend for now
                FROM sales_data
                HAVING COUNT(*) >= 5; -- Only store if we have at least 5 sales
                
                -- Count this iteration
                updated_count := updated_count + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

-- Helper function to calculate EMA from sales data JSON
CREATE OR REPLACE FUNCTION calculate_ema_from_sales_data (sales_data JSONB) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE
SET
  search_path = '' AS $$
DECLARE
    sale_record JSONB;
    price NUMERIC;
    ema NUMERIC := 0;
    alpha NUMERIC := 0.2; -- EMA smoothing factor
    count INTEGER := 0;
BEGIN
    -- Process sales data in chronological order (oldest first for EMA)
    FOR sale_record IN 
        SELECT value
        FROM jsonb_array_elements(sales_data)
        ORDER BY (value->>'date')::BIGINT ASC
    LOOP
        price := (sale_record->>'price')::NUMERIC;
        
        IF count = 0 THEN
            ema := price;
        ELSE
            ema := alpha * price + (1 - alpha) * ema;
        END IF;
        
        count := count + 1;
        EXIT WHEN count >= 50; -- Limit processing
    END LOOP;
    
    RETURN ema;
END;
$$;

-- Optimized player market value function using pre-aggregated data
CREATE OR REPLACE FUNCTION update_player_market_value_fast (player_id BIGINT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
    player_rec RECORD;
    summary_rec RECORD;
    estimated_value INTEGER;
    price_range_low INTEGER;
    price_range_high INTEGER;
    confidence_level TEXT;
    method_used TEXT;
    sample_size INTEGER;
    based_on_text TEXT;
BEGIN
    -- Get player data
    SELECT overall, age, primary_position, first_name, last_name
    INTO player_rec
    FROM public.players
    WHERE id = player_id;
    
    IF NOT FOUND OR player_rec.overall IS NULL OR player_rec.age IS NULL THEN
        RETURN;
    END IF;
    
    -- Find best matching summary data (exact match first, then closest)
    SELECT *
    INTO summary_rec
    FROM public.sales_summary
    WHERE position = player_rec.primary_position
    AND age_center BETWEEN (player_rec.age - 4) AND (player_rec.age + 4)
    AND overall_center BETWEEN (player_rec.overall - 4) AND (player_rec.overall + 4)
    ORDER BY 
        -- Prefer exact matches
        ABS(age_center - player_rec.age) + ABS(overall_center - player_rec.overall),
        sample_count DESC
    LIMIT 1;
    
    IF FOUND AND summary_rec.sample_count >= 5 THEN
        -- Use pre-aggregated data for calculation
        IF summary_rec.sample_count >= 20 AND summary_rec.recent_sales_data IS NOT NULL THEN
            -- High sample: Use EMA from recent sales data
            estimated_value := GREATEST(1, ROUND(
                public.calculate_ema_from_sales_data(summary_rec.recent_sales_data)
            ));
            confidence_level := 'High';
            method_used := 'Data-driven (High Sample)';
        ELSIF summary_rec.sample_count >= 5 THEN
            -- Medium sample: Use average with trend adjustment
            estimated_value := GREATEST(1, ROUND(
                summary_rec.avg_price * (1 + COALESCE(summary_rec.price_trend, 0))
            ));
            confidence_level := 'Medium';
            method_used := 'Data-driven (Medium Sample)';
        ELSE
            -- Low sample: Use median price
            estimated_value := GREATEST(1, ROUND(summary_rec.median_price));
            confidence_level := 'Low';
            method_used := 'Data-driven (Low Sample)';
        END IF;
        
        sample_size := summary_rec.sample_count;
        based_on_text := format('Pre-aggregated data: %s samples for %s age %s-%s, overall %s-%s',
            summary_rec.sample_count,
            summary_rec.position,
            summary_rec.age_center - summary_rec.age_range,
            summary_rec.age_center + summary_rec.age_range,
            summary_rec.overall_center - summary_rec.overall_range,
            summary_rec.overall_center + summary_rec.overall_range
        );
        
        -- Calculate price range based on confidence
        CASE confidence_level
            WHEN 'High' THEN
                price_range_low := ROUND(estimated_value * 0.85);
                price_range_high := ROUND(estimated_value * 1.15);
            WHEN 'Medium' THEN  
                price_range_low := ROUND(estimated_value * 0.8);
                price_range_high := ROUND(estimated_value * 1.2);
            ELSE
                price_range_low := ROUND(estimated_value * 0.7);
                price_range_high := ROUND(estimated_value * 1.3);
        END CASE;
    ELSE
        -- Fallback to comprehensive formula if no summary data
        estimated_value := GREATEST(1, ROUND(
            public.calculate_comprehensive_player_value(
                player_rec.overall, 
                player_rec.age, 
                player_rec.primary_position
            )
        ));
        price_range_low := ROUND(estimated_value * 0.8);
        price_range_high := ROUND(estimated_value * 1.2);
        confidence_level := 'Low';
        method_used := 'Formula Fallback';
        sample_size := 0;
        based_on_text := format('Comprehensive formula for %s %s yo %s ovr (no market data)',
            player_rec.primary_position, player_rec.age, player_rec.overall);
    END IF;
    
    -- Update player record
    UPDATE public.players
    SET 
        market_value_estimate = estimated_value,
        market_value_low = price_range_low,
        market_value_high = price_range_high,
        market_value_confidence = confidence_level,
        market_value_method = method_used,
        market_value_sample_size = sample_size,
        market_value_based_on = based_on_text,
        market_value_updated_at = NOW(),
        base_value_estimate = ROUND(public.calculate_base_player_value(player_rec.overall))
    WHERE id = player_id;
END;
$$;

-- Ultra-fast bulk update function using single SQL operation per chunk
CREATE OR REPLACE FUNCTION update_players_market_values_batch (
  batch_size INTEGER DEFAULT 5000,
  offset_val INTEGER DEFAULT 0
) RETURNS TABLE (
  processed_count INTEGER,
  updated_count INTEGER,
  error_count INTEGER
) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
DECLARE
  updated INTEGER := 0;
BEGIN
  
  -- Single bulk UPDATE statement using CTE for maximum performance
  WITH batch_players AS (
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  ),
  market_values AS (
    SELECT 
      bp.id as player_id,
      -- Use the comprehensive value function directly
      public.calculate_comprehensive_player_value(bp.overall, bp.age, bp.primary_position) as estimated_value,
      -- Simple confidence and method for bulk operation
      CASE 
        WHEN bp.overall >= 85 AND bp.age <= 25 THEN 'High'
        WHEN bp.overall >= 75 OR bp.age <= 30 THEN 'Medium' 
        ELSE 'Low'
      END as confidence_level,
      'Comprehensive formula + market multipliers' as method_used
    FROM batch_players bp
  )
  UPDATE public.players p SET 
    market_value_estimate = GREATEST(1, ROUND(mv.estimated_value)),
    market_value_confidence = mv.confidence_level,
    market_value_method = mv.method_used,
    market_value_updated_at = NOW()
  FROM market_values mv 
  WHERE p.id = mv.player_id;
  
  -- Get the row count from the update
  GET DIAGNOSTICS updated = ROW_COUNT;
  
  -- Return results
  RETURN QUERY SELECT updated;
END;
$$;

-- RPC function to update sync_config with total player count
CREATE OR REPLACE FUNCTION update_total_player_count () RETURNS TABLE (total_count bigint, updated_at timestamptz) LANGUAGE plpgsql security definer
set
  search_path = '' AS $$
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
$$;