alter table "public"."players" add column "search_text" text generated always as (lower(TRIM(BOTH FROM (((((id)::text || ' '::text) || COALESCE(first_name, ''::text)) || ' '::text) || COALESCE(last_name, ''::text))))) stored;


