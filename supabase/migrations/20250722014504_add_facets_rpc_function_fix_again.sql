drop function if exists "public"."get_filter_counts"(search_text text, favourites_filter text, selected_tags text[], tags_match_all boolean, wallet_address_filter text, excluded_nationalities text[], excluded_positions text[], excluded_secondary_positions text[], excluded_owners text[], excluded_clubs text[], excluded_best_positions text[], excluded_preferred_foot text, age_min_filter integer, age_max_filter integer, height_min_filter integer, height_max_filter integer, overall_min_filter integer, overall_max_filter integer, pace_min_filter integer, pace_max_filter integer, shooting_min_filter integer, shooting_max_filter integer, passing_min_filter integer, passing_max_filter integer, dribbling_min_filter integer, dribbling_max_filter integer, defense_min_filter integer, defense_max_filter integer, physical_min_filter integer, physical_max_filter integer, best_overall_min_filter integer, best_overall_max_filter integer, market_value_min_filter integer, market_value_max_filter integer, price_diff_min_filter integer, price_diff_max_filter integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_filter_counts(search_text text DEFAULT NULL::text, favourites_filter text DEFAULT 'all'::text, selected_tags text[] DEFAULT '{}'::text[], tags_match_all boolean DEFAULT false, wallet_address_filter text DEFAULT NULL::text, applied_nationalities text[] DEFAULT '{}'::text[], applied_positions text[] DEFAULT '{}'::text[], applied_secondary_positions text[] DEFAULT '{}'::text[], applied_owners text[] DEFAULT '{}'::text[], applied_clubs text[] DEFAULT '{}'::text[], applied_best_positions text[] DEFAULT '{}'::text[], applied_preferred_foot text DEFAULT NULL::text, age_min_filter integer DEFAULT NULL::integer, age_max_filter integer DEFAULT NULL::integer, height_min_filter integer DEFAULT NULL::integer, height_max_filter integer DEFAULT NULL::integer, overall_min_filter integer DEFAULT NULL::integer, overall_max_filter integer DEFAULT NULL::integer, pace_min_filter integer DEFAULT NULL::integer, pace_max_filter integer DEFAULT NULL::integer, shooting_min_filter integer DEFAULT NULL::integer, shooting_max_filter integer DEFAULT NULL::integer, passing_min_filter integer DEFAULT NULL::integer, passing_max_filter integer DEFAULT NULL::integer, dribbling_min_filter integer DEFAULT NULL::integer, dribbling_max_filter integer DEFAULT NULL::integer, defense_min_filter integer DEFAULT NULL::integer, defense_max_filter integer DEFAULT NULL::integer, physical_min_filter integer DEFAULT NULL::integer, physical_max_filter integer DEFAULT NULL::integer, best_overall_min_filter integer DEFAULT NULL::integer, best_overall_max_filter integer DEFAULT NULL::integer, market_value_min_filter integer DEFAULT NULL::integer, market_value_max_filter integer DEFAULT NULL::integer, price_diff_min_filter integer DEFAULT NULL::integer, price_diff_max_filter integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_query TEXT;
  result JSON;
BEGIN
  -- Build base WHERE clause for filtering
  base_query := '
    FROM players p
    LEFT JOIN favourites f ON p.id = f.player_id AND f.wallet_address = COALESCE($1, '''')
    WHERE 1=1
  ';
  
  -- Add search filter
  IF search_text IS NOT NULL AND search_text != '' THEN
    base_query := base_query || ' AND p.search_text ILIKE ''%' || search_text || '%''';
  END IF;
  
  -- Add favourites filter
  IF favourites_filter = 'favourites' THEN
    base_query := base_query || ' AND f.is_favourite = true';
  ELSIF favourites_filter = 'non-favourites' THEN
    base_query := base_query || ' AND (f.is_favourite = false OR f.is_favourite IS NULL)';
  END IF;
  
  -- Add tags filter
  IF array_length(selected_tags, 1) > 0 THEN
    IF tags_match_all THEN
      base_query := base_query || ' AND f.tags @> ARRAY[' || array_to_string(selected_tags, ',') || ']::text[]';
    ELSE
      base_query := base_query || ' AND f.tags && ARRAY[' || array_to_string(selected_tags, ',') || ']::text[]';
    END IF;
  END IF;
  
  -- Add wallet address filter
  IF wallet_address_filter IS NOT NULL AND wallet_address_filter != '' THEN
    base_query := base_query || ' AND p.owner_wallet_address = ''' || wallet_address_filter || '''';
  END IF;
  
  -- Add applied multi-select filters
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
    base_query := base_query || ' AND p.club_name = ANY(ARRAY[''' || array_to_string(applied_clubs, ''',''') || '''])';
  END IF;
  IF array_length(applied_best_positions, 1) > 0 THEN
    base_query := base_query || ' AND p.best_position = ANY(ARRAY[''' || array_to_string(applied_best_positions, ''',''') || '''])';
  END IF;
  IF applied_preferred_foot IS NOT NULL AND applied_preferred_foot != '' THEN
    base_query := base_query || ' AND p.preferred_foot = ''' || applied_preferred_foot || '''';
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
          GROUP BY owner
          ORDER BY count DESC, owner
          LIMIT 100
        ) t
      ),
      ''clubs'', (
        SELECT json_object_agg(club, count)
        FROM (
          SELECT p.club_name as club, COUNT(*) as count
          ' || base_query || '
          AND p.club_name IS NOT NULL
          GROUP BY club
          ORDER BY count DESC, club
          LIMIT 100
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
      )
    )
  ' INTO result
  USING 
    wallet_address_filter;
  
  RETURN result;
END;
$function$
;


