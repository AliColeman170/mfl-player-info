create policy "Enable read access for all users"
on "public"."sync_config"
as permissive
for select
to public
using (true);



