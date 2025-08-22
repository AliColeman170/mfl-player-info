drop function if exists "public"."analyze_multi_variable_pricing" (days_back integer, min_sales integer);

drop function if exists "public"."test_pricing_model_accuracy" (days_back integer, sample_size integer);

drop function if exists "public"."trigger_update_player_market_value" ();

drop function if exists "public"."update_all_player_base_values" ();

drop function if exists "public"."update_all_players_market_values" ();

drop function if exists "public"."update_player_market_value" (player_id bigint);

drop function if exists "public"."update_player_market_value_fast" (player_id bigint);

drop index if exists "public"."idx_players_market_calculated";

alter table "public"."players"
drop column "base_value_estimate";

alter table "public"."players"
drop column "market_value_based_on";

alter table "public"."players"
drop column "market_value_calculated_at";

alter table "public"."players"
drop column "market_value_sample_size";

alter table "public"."players"
drop column "sync_version";
