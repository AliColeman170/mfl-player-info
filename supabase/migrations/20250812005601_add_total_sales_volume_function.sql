set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_total_sales_volume()
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_volume BIGINT;
BEGIN
  SELECT COALESCE(SUM(price), 0) INTO total_volume FROM sales;
  RETURN total_volume;
END;
$function$
;


