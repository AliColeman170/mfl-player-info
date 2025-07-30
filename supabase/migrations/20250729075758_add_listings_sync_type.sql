alter table "public"."sync_status" drop constraint "sync_status_sync_type_check";

alter table "public"."sync_status" add constraint "sync_status_sync_type_check" CHECK ((sync_type = ANY (ARRAY['full'::text, 'individual'::text, 'listings'::text]))) not valid;

alter table "public"."sync_status" validate constraint "sync_status_sync_type_check";


