set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_sales_price_vs_overall_graph(days_back integer DEFAULT 365)
 RETURNS TABLE(overall_rating integer, avg_price numeric, sale_count bigint, min_price integer, max_price integer, trimmed_avg_price numeric, trimmed_sale_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;


