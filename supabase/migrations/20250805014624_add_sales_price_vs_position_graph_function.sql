set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_sales_price_vs_position_graph(days_back integer DEFAULT 90)
 RETURNS TABLE(player_position text, avg_price numeric, sale_count bigint, min_price integer, max_price integer, trimmed_avg_price numeric, trimmed_sale_count bigint, position_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;


