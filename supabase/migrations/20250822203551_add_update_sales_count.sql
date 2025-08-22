set
  check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_total_sales_count () RETURNS TABLE (
  total_count bigint,
  updated_at timestamp with time zone
) LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path TO '' AS $function$
DECLARE
  sales_count bigint;
BEGIN
  -- Get the total count of players
  SELECT COUNT(*) INTO sales_count FROM public.sales;
  
  -- Upsert the config value
  INSERT INTO public.sync_config (config_key, config_value, updated_at)
  VALUES ('total_sales_count', sales_count::text, NOW())
  ON CONFLICT (config_key) 
  DO UPDATE SET 
    config_value = sales_count::text,
    updated_at = NOW();
  
  -- Return the count and timestamp
  RETURN QUERY
  SELECT 
    sales_count as total_count,
    NOW() as updated_at;
END;
$function$;
