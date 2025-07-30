create sequence "public"."sales_id_seq";

create table "public"."sales" (
    "id" bigint not null default nextval('sales_id_seq'::regclass),
    "listing_resource_id" bigint not null,
    "player_id" bigint not null,
    "price" integer not null,
    "seller_wallet_address" text,
    "buyer_wallet_address" text,
    "created_date_time" bigint not null,
    "purchase_date_time" bigint,
    "status" text default 'BOUGHT'::text,
    "player_age" integer,
    "player_overall" integer,
    "player_position" text,
    "imported_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."sales" enable row level security;

alter sequence "public"."sales_id_seq" owned by "public"."sales"."id";

CREATE INDEX idx_sales_age_overall_position ON public.sales USING btree (player_age, player_overall, player_position);

CREATE INDEX idx_sales_created_date_time ON public.sales USING btree (created_date_time DESC);

CREATE INDEX idx_sales_imported_at ON public.sales USING btree (imported_at);

CREATE INDEX idx_sales_listing_resource_id ON public.sales USING btree (listing_resource_id);

CREATE INDEX idx_sales_overall_age ON public.sales USING btree (player_overall, player_age);

CREATE INDEX idx_sales_player_id ON public.sales USING btree (player_id);

CREATE INDEX idx_sales_position_overall ON public.sales USING btree (player_position, player_overall);

CREATE INDEX idx_sales_purchase_date_time ON public.sales USING btree (purchase_date_time DESC);

CREATE UNIQUE INDEX sales_listing_resource_id_unique ON public.sales USING btree (listing_resource_id);

CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id);

alter table "public"."sales" add constraint "sales_pkey" PRIMARY KEY using index "sales_pkey";

alter table "public"."sales" add constraint "sales_listing_resource_id_unique" UNIQUE using index "sales_listing_resource_id_unique";

alter table "public"."sales" add constraint "sales_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) not valid;

alter table "public"."sales" validate constraint "sales_player_id_fkey";

alter table "public"."sales" add constraint "sales_price_positive" CHECK ((price > 0)) not valid;

alter table "public"."sales" validate constraint "sales_price_positive";

grant delete on table "public"."sales" to "anon";

grant insert on table "public"."sales" to "anon";

grant references on table "public"."sales" to "anon";

grant select on table "public"."sales" to "anon";

grant trigger on table "public"."sales" to "anon";

grant truncate on table "public"."sales" to "anon";

grant update on table "public"."sales" to "anon";

grant delete on table "public"."sales" to "authenticated";

grant insert on table "public"."sales" to "authenticated";

grant references on table "public"."sales" to "authenticated";

grant select on table "public"."sales" to "authenticated";

grant trigger on table "public"."sales" to "authenticated";

grant truncate on table "public"."sales" to "authenticated";

grant update on table "public"."sales" to "authenticated";

grant delete on table "public"."sales" to "service_role";

grant insert on table "public"."sales" to "service_role";

grant references on table "public"."sales" to "service_role";

grant select on table "public"."sales" to "service_role";

grant trigger on table "public"."sales" to "service_role";

grant truncate on table "public"."sales" to "service_role";

grant update on table "public"."sales" to "service_role";

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


