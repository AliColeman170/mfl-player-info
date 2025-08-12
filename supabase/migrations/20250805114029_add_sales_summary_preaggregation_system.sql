create sequence "public"."sales_summary_id_seq";

create table "public"."sales_summary" (
    "id" integer not null default nextval('sales_summary_id_seq'::regclass),
    "position" character varying(10) not null,
    "age_center" integer not null,
    "overall_center" integer not null,
    "age_range" integer not null default 3,
    "overall_range" integer not null default 3,
    "sample_count" integer not null default 0,
    "avg_price" numeric(10,2),
    "median_price" numeric(10,2),
    "recent_sales_data" jsonb,
    "price_trend" numeric(5,4),
    "last_updated" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter sequence "public"."sales_summary_id_seq" owned by "public"."sales_summary"."id";

CREATE INDEX idx_sales_summary_lookup ON public.sales_summary USING btree ("position", age_center, overall_center);

CREATE UNIQUE INDEX sales_summary_pkey ON public.sales_summary USING btree (id);

CREATE UNIQUE INDEX sales_summary_position_age_center_overall_center_age_range__key ON public.sales_summary USING btree ("position", age_center, overall_center, age_range, overall_range);

alter table "public"."sales_summary" add constraint "sales_summary_pkey" PRIMARY KEY using index "sales_summary_pkey";

alter table "public"."sales_summary" add constraint "sales_summary_position_age_center_overall_center_age_range__key" UNIQUE using index "sales_summary_position_age_center_overall_center_age_range__key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_ema_from_sales_data(sales_data jsonb)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_player_market_value_fast(player_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
                calculate_ema_from_sales_data(summary_rec.recent_sales_data)
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_sales_summary()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    pos VARCHAR(10);
    age_val INTEGER;
    overall_val INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Clear existing summary data
    DELETE FROM public.sales_summary;
    
    -- Generate summary for common position/age/overall combinations
    FOR pos IN SELECT DISTINCT player_position FROM public.sales WHERE player_position IS NOT NULL
    LOOP
        FOR age_val IN SELECT generate_series(18, 38, 2) -- Every 2 years from 18-38
        LOOP
            FOR overall_val IN SELECT generate_series(45, 95, 5) -- Every 5 overall from 45-95
            LOOP
                INSERT INTO public.sales_summary (
                    position, age_center, overall_center, age_range, overall_range,
                    sample_count, avg_price, median_price, recent_sales_data, price_trend
                )
                SELECT 
                    pos,
                    age_val,
                    overall_val,
                    3, -- ±3 range
                    3, -- ±3 range
                    COUNT(*),
                    ROUND(AVG(price), 2),
                    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price), 2),
                    -- Store recent sales for EMA (last 50 sales, with dates)
                    COALESCE(
                        jsonb_agg(
                            jsonb_build_object(
                                'price', price,
                                'date', COALESCE(purchase_date_time, created_date_time)
                            ) 
                            ORDER BY COALESCE(purchase_date_time, created_date_time) DESC
                        ) FILTER (WHERE rn <= 50),
                        '[]'::jsonb
                    ),
                    -- Calculate price trend (recent vs older)
                    CASE 
                        WHEN COUNT(*) >= 10 THEN
                            COALESCE(
                                (recent_avg.avg_price / older_avg.avg_price) - 1,
                                0
                            )
                        ELSE 0
                    END
                FROM (
                    SELECT 
                        s.*,
                        ROW_NUMBER() OVER (ORDER BY COALESCE(s.purchase_date_time, s.created_date_time) DESC) as rn
                    FROM public.sales s
                    WHERE s.player_position = pos
                    AND s.player_age BETWEEN (age_val - 3) AND (age_val + 3)
                    AND s.player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)
                    AND s.price > 0
                    AND s.status = 'BOUGHT'
                    -- Only recent sales (last 12 months)
                    AND COALESCE(s.purchase_date_time, s.created_date_time) >= EXTRACT(EPOCH FROM (NOW() - INTERVAL '12 months')) * 1000
                ) sales_data
                LEFT JOIN (
                    -- Recent average (last 25% of sales)
                    SELECT AVG(price) as avg_price
                    FROM (
                        SELECT s.price
                        FROM public.sales s
                        WHERE s.player_position = pos
                        AND s.player_age BETWEEN (age_val - 3) AND (age_val + 3)
                        AND s.player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)
                        AND s.price > 0 AND s.status = 'BOUGHT'
                        ORDER BY COALESCE(s.purchase_date_time, s.created_date_time) DESC
                        LIMIT GREATEST(1, (SELECT COUNT(*) FROM public.sales WHERE player_position = pos AND player_age BETWEEN (age_val - 3) AND (age_val + 3) AND player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)) / 4)
                    ) recent
                ) recent_avg ON true
                LEFT JOIN (
                    -- Older average (older 25% of sales) 
                    SELECT AVG(price) as avg_price
                    FROM (
                        SELECT s.price
                        FROM public.sales s
                        WHERE s.player_position = pos
                        AND s.player_age BETWEEN (age_val - 3) AND (age_val + 3)
                        AND s.player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)
                        AND s.price > 0 AND s.status = 'BOUGHT'
                        ORDER BY COALESCE(s.purchase_date_time, s.created_date_time) ASC
                        LIMIT GREATEST(1, (SELECT COUNT(*) FROM public.sales WHERE player_position = pos AND player_age BETWEEN (age_val - 3) AND (age_val + 3) AND player_overall BETWEEN (overall_val - 3) AND (overall_val + 3)) / 4)
                    ) older
                ) older_avg ON true
                HAVING COUNT(*) >= 5; -- Only store if we have at least 5 sales
                
                updated_count := updated_count + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_players_market_values_batch(batch_size integer DEFAULT 100, offset_val integer DEFAULT 0)
 RETURNS TABLE(processed_count integer, updated_count integer, error_count integer, total_players integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  player_rec RECORD;
  processed INTEGER := 0;
  updated INTEGER := 0;
  errors INTEGER := 0;
  total INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total FROM public.players WHERE overall IS NOT NULL;
  
  -- Process batch of players using the fast function
  FOR player_rec IN 
    SELECT id, overall, age, primary_position
    FROM public.players 
    WHERE overall IS NOT NULL
    ORDER BY id
    LIMIT batch_size OFFSET offset_val
  LOOP
    BEGIN
      processed := processed + 1;
      
      -- Update this player's market value using fast function
      PERFORM public.update_player_market_value_fast(player_rec.id);
      updated := updated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      -- Log error but continue processing
      RAISE NOTICE 'Error updating player %: %', player_rec.id, SQLERRM;
    END;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT processed, updated, errors, total;
END;
$function$
;

grant delete on table "public"."sales_summary" to "anon";

grant insert on table "public"."sales_summary" to "anon";

grant references on table "public"."sales_summary" to "anon";

grant select on table "public"."sales_summary" to "anon";

grant trigger on table "public"."sales_summary" to "anon";

grant truncate on table "public"."sales_summary" to "anon";

grant update on table "public"."sales_summary" to "anon";

grant delete on table "public"."sales_summary" to "authenticated";

grant insert on table "public"."sales_summary" to "authenticated";

grant references on table "public"."sales_summary" to "authenticated";

grant select on table "public"."sales_summary" to "authenticated";

grant trigger on table "public"."sales_summary" to "authenticated";

grant truncate on table "public"."sales_summary" to "authenticated";

grant update on table "public"."sales_summary" to "authenticated";

grant delete on table "public"."sales_summary" to "service_role";

grant insert on table "public"."sales_summary" to "service_role";

grant references on table "public"."sales_summary" to "service_role";

grant select on table "public"."sales_summary" to "service_role";

grant trigger on table "public"."sales_summary" to "service_role";

grant truncate on table "public"."sales_summary" to "service_role";

grant update on table "public"."sales_summary" to "service_role";


