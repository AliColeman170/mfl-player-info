create policy "Enable select for sales"
on "public"."sales"
as permissive
for select
to authenticated, anon
using (true);



