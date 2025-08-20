create policy "Enable select for users based on wallet address"
on "public"."upstash_workflow_executions"
as permissive
for select
to authenticated
using ((( SELECT ((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'address'::text)) = '0xb6fbc6072df85634'::text));



