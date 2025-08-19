drop trigger if exists "update_player_sync_metadata_updated_at" on "public"."player_sync_metadata";

drop trigger if exists "update_sales_sync_metadata_updated_at" on "public"."sales_sync_metadata";

drop trigger if exists "update_sync_stages_updated_at" on "public"."sync_stages";

drop policy "Enable all operations for service role" on "public"."sync_status";

drop policy "Enable read access for all users" on "public"."sync_status";

revoke delete on table "public"."player_sync_metadata" from "anon";

revoke insert on table "public"."player_sync_metadata" from "anon";

revoke references on table "public"."player_sync_metadata" from "anon";

revoke select on table "public"."player_sync_metadata" from "anon";

revoke trigger on table "public"."player_sync_metadata" from "anon";

revoke truncate on table "public"."player_sync_metadata" from "anon";

revoke update on table "public"."player_sync_metadata" from "anon";

revoke delete on table "public"."player_sync_metadata" from "authenticated";

revoke insert on table "public"."player_sync_metadata" from "authenticated";

revoke references on table "public"."player_sync_metadata" from "authenticated";

revoke select on table "public"."player_sync_metadata" from "authenticated";

revoke trigger on table "public"."player_sync_metadata" from "authenticated";

revoke truncate on table "public"."player_sync_metadata" from "authenticated";

revoke update on table "public"."player_sync_metadata" from "authenticated";

revoke delete on table "public"."player_sync_metadata" from "service_role";

revoke insert on table "public"."player_sync_metadata" from "service_role";

revoke references on table "public"."player_sync_metadata" from "service_role";

revoke select on table "public"."player_sync_metadata" from "service_role";

revoke trigger on table "public"."player_sync_metadata" from "service_role";

revoke truncate on table "public"."player_sync_metadata" from "service_role";

revoke update on table "public"."player_sync_metadata" from "service_role";

revoke delete on table "public"."sales_sync_metadata" from "anon";

revoke insert on table "public"."sales_sync_metadata" from "anon";

revoke references on table "public"."sales_sync_metadata" from "anon";

revoke select on table "public"."sales_sync_metadata" from "anon";

revoke trigger on table "public"."sales_sync_metadata" from "anon";

revoke truncate on table "public"."sales_sync_metadata" from "anon";

revoke update on table "public"."sales_sync_metadata" from "anon";

revoke delete on table "public"."sales_sync_metadata" from "authenticated";

revoke insert on table "public"."sales_sync_metadata" from "authenticated";

revoke references on table "public"."sales_sync_metadata" from "authenticated";

revoke select on table "public"."sales_sync_metadata" from "authenticated";

revoke trigger on table "public"."sales_sync_metadata" from "authenticated";

revoke truncate on table "public"."sales_sync_metadata" from "authenticated";

revoke update on table "public"."sales_sync_metadata" from "authenticated";

revoke delete on table "public"."sales_sync_metadata" from "service_role";

revoke insert on table "public"."sales_sync_metadata" from "service_role";

revoke references on table "public"."sales_sync_metadata" from "service_role";

revoke select on table "public"."sales_sync_metadata" from "service_role";

revoke trigger on table "public"."sales_sync_metadata" from "service_role";

revoke truncate on table "public"."sales_sync_metadata" from "service_role";

revoke update on table "public"."sales_sync_metadata" from "service_role";

revoke delete on table "public"."sync_executions" from "anon";

revoke insert on table "public"."sync_executions" from "anon";

revoke references on table "public"."sync_executions" from "anon";

revoke select on table "public"."sync_executions" from "anon";

revoke trigger on table "public"."sync_executions" from "anon";

revoke truncate on table "public"."sync_executions" from "anon";

revoke update on table "public"."sync_executions" from "anon";

revoke delete on table "public"."sync_executions" from "authenticated";

revoke insert on table "public"."sync_executions" from "authenticated";

revoke references on table "public"."sync_executions" from "authenticated";

revoke select on table "public"."sync_executions" from "authenticated";

revoke trigger on table "public"."sync_executions" from "authenticated";

revoke truncate on table "public"."sync_executions" from "authenticated";

revoke update on table "public"."sync_executions" from "authenticated";

revoke delete on table "public"."sync_executions" from "service_role";

revoke insert on table "public"."sync_executions" from "service_role";

revoke references on table "public"."sync_executions" from "service_role";

revoke select on table "public"."sync_executions" from "service_role";

revoke trigger on table "public"."sync_executions" from "service_role";

revoke truncate on table "public"."sync_executions" from "service_role";

revoke update on table "public"."sync_executions" from "service_role";

revoke delete on table "public"."sync_stages" from "anon";

revoke insert on table "public"."sync_stages" from "anon";

revoke references on table "public"."sync_stages" from "anon";

revoke select on table "public"."sync_stages" from "anon";

revoke trigger on table "public"."sync_stages" from "anon";

revoke truncate on table "public"."sync_stages" from "anon";

revoke update on table "public"."sync_stages" from "anon";

revoke delete on table "public"."sync_stages" from "authenticated";

revoke insert on table "public"."sync_stages" from "authenticated";

revoke references on table "public"."sync_stages" from "authenticated";

revoke select on table "public"."sync_stages" from "authenticated";

revoke trigger on table "public"."sync_stages" from "authenticated";

revoke truncate on table "public"."sync_stages" from "authenticated";

revoke update on table "public"."sync_stages" from "authenticated";

revoke delete on table "public"."sync_stages" from "service_role";

revoke insert on table "public"."sync_stages" from "service_role";

revoke references on table "public"."sync_stages" from "service_role";

revoke select on table "public"."sync_stages" from "service_role";

revoke trigger on table "public"."sync_stages" from "service_role";

revoke truncate on table "public"."sync_stages" from "service_role";

revoke update on table "public"."sync_stages" from "service_role";

revoke delete on table "public"."sync_status" from "anon";

revoke insert on table "public"."sync_status" from "anon";

revoke references on table "public"."sync_status" from "anon";

revoke select on table "public"."sync_status" from "anon";

revoke trigger on table "public"."sync_status" from "anon";

revoke truncate on table "public"."sync_status" from "anon";

revoke update on table "public"."sync_status" from "anon";

revoke delete on table "public"."sync_status" from "authenticated";

revoke insert on table "public"."sync_status" from "authenticated";

revoke references on table "public"."sync_status" from "authenticated";

revoke select on table "public"."sync_status" from "authenticated";

revoke trigger on table "public"."sync_status" from "authenticated";

revoke truncate on table "public"."sync_status" from "authenticated";

revoke update on table "public"."sync_status" from "authenticated";

revoke delete on table "public"."sync_status" from "service_role";

revoke insert on table "public"."sync_status" from "service_role";

revoke references on table "public"."sync_status" from "service_role";

revoke select on table "public"."sync_status" from "service_role";

revoke trigger on table "public"."sync_status" from "service_role";

revoke truncate on table "public"."sync_status" from "service_role";

revoke update on table "public"."sync_status" from "service_role";

alter table "public"."sync_executions" drop constraint "sync_executions_execution_type_check";

alter table "public"."sync_executions" drop constraint "sync_executions_status_check";

alter table "public"."sync_stages" drop constraint "sync_stages_stage_name_key";

alter table "public"."sync_stages" drop constraint "sync_stages_status_check";

alter table "public"."sync_status" drop constraint "sync_status_status_check";

alter table "public"."sync_status" drop constraint "sync_status_sync_type_check";

drop function if exists "public"."get_sync_status"();

alter table "public"."player_sync_metadata" drop constraint "player_sync_metadata_pkey";

alter table "public"."sales_sync_metadata" drop constraint "sales_sync_metadata_pkey";

alter table "public"."sync_executions" drop constraint "sync_executions_pkey";

alter table "public"."sync_stages" drop constraint "sync_stages_pkey";

alter table "public"."sync_status" drop constraint "sync_status_pkey";

drop index if exists "public"."idx_player_sync_metadata_started_at";

drop index if exists "public"."idx_player_sync_metadata_status";

drop index if exists "public"."idx_players_sync_stage";

drop index if exists "public"."idx_sales_sync_metadata_started_at";

drop index if exists "public"."idx_sales_sync_metadata_status";

drop index if exists "public"."idx_sync_executions_stage";

drop index if exists "public"."idx_sync_executions_status";

drop index if exists "public"."idx_sync_stages_order";

drop index if exists "public"."idx_sync_stages_status";

drop index if exists "public"."idx_sync_status_started_at";

drop index if exists "public"."idx_sync_status_type";

drop index if exists "public"."player_sync_metadata_pkey";

drop index if exists "public"."sales_sync_metadata_pkey";

drop index if exists "public"."sync_executions_pkey";

drop index if exists "public"."sync_stages_pkey";

drop index if exists "public"."sync_stages_stage_name_key";

drop index if exists "public"."sync_status_pkey";

drop table "public"."player_sync_metadata";

drop table "public"."sales_sync_metadata";

drop table "public"."sync_executions";

drop table "public"."sync_stages";

drop table "public"."sync_status";

drop sequence if exists "public"."player_sync_metadata_id_seq";

drop sequence if exists "public"."sales_sync_metadata_id_seq";

drop sequence if exists "public"."sync_executions_id_seq";

drop sequence if exists "public"."sync_stages_id_seq";

drop sequence if exists "public"."sync_status_id_seq";


