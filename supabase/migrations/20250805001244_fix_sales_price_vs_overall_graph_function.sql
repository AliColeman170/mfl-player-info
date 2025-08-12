set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_sales_price_vs_overall_graph(days_back integer DEFAULT 365)
 RETURNS TABLE(overall_rating integer, avg_price numeric, sale_count bigint, min_price integer, max_price integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.player_overall, p.overall) as overall_rating,
    ROUND(AVG(s.price), 2) as avg_price,
    COUNT(s.listing_resource_id) as sale_count,
    MIN(s.price) as min_price,
    MAX(s.price) as max_price
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
  GROUP BY COALESCE(s.player_overall, p.overall)
  HAVING COUNT(s.listing_resource_id) >= 3  -- Only include ratings with at least 3 sales for statistical relevance
  ORDER BY COALESCE(s.player_overall, p.overall);
END;
$function$
;


