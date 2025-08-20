drop policy "Enable delete for users based on wallet address" on "public"."favourites";

drop policy "Enable select for users based on wallet address" on "public"."favourites";

drop policy "Enable update for users based on wallet address" on "public"."favourites";

alter table "public"."sales_summary" enable row level security;

alter table "public"."sync_config" enable row level security;

alter table "public"."upstash_workflow_executions" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create policy "Enable delete for users based on wallet address"
on "public"."favourites"
as permissive
for delete
to authenticated
using ((( SELECT ((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));


create policy "Enable select for users based on wallet address"
on "public"."favourites"
as permissive
for select
to authenticated
using ((( SELECT ((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));


create policy "Enable update for users based on wallet address"
on "public"."favourites"
as permissive
for update
to authenticated
using ((( SELECT ((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address))
with check ((( SELECT ((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));



