create table "public"."upstash_workflow_executions" (
    "id" uuid not null default gen_random_uuid(),
    "workflow_run_id" text not null,
    "workflow_name" text not null,
    "status" text not null default 'running'::text,
    "started_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "error_message" text,
    "progress" jsonb default '{}'::jsonb,
    "total_steps" integer default 0,
    "completed_steps" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


CREATE INDEX idx_upstash_workflow_executions_started_at ON public.upstash_workflow_executions USING btree (started_at DESC);

CREATE INDEX idx_upstash_workflow_executions_status ON public.upstash_workflow_executions USING btree (status);

CREATE INDEX idx_upstash_workflow_executions_workflow_name ON public.upstash_workflow_executions USING btree (workflow_name);

CREATE UNIQUE INDEX upstash_workflow_executions_pkey ON public.upstash_workflow_executions USING btree (id);

CREATE UNIQUE INDEX upstash_workflow_executions_workflow_run_id_key ON public.upstash_workflow_executions USING btree (workflow_run_id);

alter table "public"."upstash_workflow_executions" add constraint "upstash_workflow_executions_pkey" PRIMARY KEY using index "upstash_workflow_executions_pkey";

alter table "public"."upstash_workflow_executions" add constraint "upstash_workflow_executions_status_check" CHECK ((status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."upstash_workflow_executions" validate constraint "upstash_workflow_executions_status_check";

alter table "public"."upstash_workflow_executions" add constraint "upstash_workflow_executions_workflow_run_id_key" UNIQUE using index "upstash_workflow_executions_workflow_run_id_key";

grant delete on table "public"."upstash_workflow_executions" to "anon";

grant insert on table "public"."upstash_workflow_executions" to "anon";

grant references on table "public"."upstash_workflow_executions" to "anon";

grant select on table "public"."upstash_workflow_executions" to "anon";

grant trigger on table "public"."upstash_workflow_executions" to "anon";

grant truncate on table "public"."upstash_workflow_executions" to "anon";

grant update on table "public"."upstash_workflow_executions" to "anon";

grant delete on table "public"."upstash_workflow_executions" to "authenticated";

grant insert on table "public"."upstash_workflow_executions" to "authenticated";

grant references on table "public"."upstash_workflow_executions" to "authenticated";

grant select on table "public"."upstash_workflow_executions" to "authenticated";

grant trigger on table "public"."upstash_workflow_executions" to "authenticated";

grant truncate on table "public"."upstash_workflow_executions" to "authenticated";

grant update on table "public"."upstash_workflow_executions" to "authenticated";

grant delete on table "public"."upstash_workflow_executions" to "service_role";

grant insert on table "public"."upstash_workflow_executions" to "service_role";

grant references on table "public"."upstash_workflow_executions" to "service_role";

grant select on table "public"."upstash_workflow_executions" to "service_role";

grant trigger on table "public"."upstash_workflow_executions" to "service_role";

grant truncate on table "public"."upstash_workflow_executions" to "service_role";

grant update on table "public"."upstash_workflow_executions" to "service_role";

CREATE TRIGGER update_upstash_workflow_executions_updated_at BEFORE UPDATE ON public.upstash_workflow_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


