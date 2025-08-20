alter table "public"."sales" drop constraint "sales_listing_resource_id_unique";

alter table "public"."sales" drop constraint "sales_pkey";

drop index if exists "public"."sales_listing_resource_id_unique";

drop index if exists "public"."sales_pkey";

alter table "public"."players" add column "is_retired" boolean default false;

alter table "public"."sales" drop column "id";

drop sequence if exists "public"."sales_id_seq";

CREATE INDEX idx_players_is_retired ON public.players USING btree (is_retired);

CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (listing_resource_id);

alter table "public"."sales" add constraint "sales_pkey" PRIMARY KEY using index "sales_pkey";


