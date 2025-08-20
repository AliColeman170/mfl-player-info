drop policy "Enable delete for users based on wallet address" on "public"."favourites";

drop policy "Enable select for users based on wallet address" on "public"."favourites";

drop policy "Enable update for users based on wallet address" on "public"."favourites";

create policy "Enable delete for users based on wallet address"
on "public"."favourites"
as permissive
for delete
to authenticated
using ((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));


create policy "Enable select for users based on wallet address"
on "public"."favourites"
as permissive
for select
to authenticated
using ((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));


create policy "Enable update for users based on wallet address"
on "public"."favourites"
as permissive
for update
to authenticated
using ((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address))
with check ((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'address'::text)) = wallet_address));



