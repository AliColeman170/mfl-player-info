SET
    statement_timeout = 0;

SET
    lock_timeout = 0;

SET
    idle_in_transaction_session_timeout = 0;

SET
    client_encoding = 'UTF8';

SET
    standard_conforming_strings = on;

SELECT
    pg_catalog.set_config ('search_path', '', false);

SET
    check_function_bodies = false;

SET
    xmloption = content;

SET
    client_min_messages = warning;

SET
    row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql"
WITH
    SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault"
WITH
    SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
WITH
    SCHEMA "extensions";

SET
    default_tablespace = '';

SET
    default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."favourites" (
    "wallet_address" "text" NOT NULL,
    "player_id" bigint NOT NULL,
    "tags" "text" [] DEFAULT '{}'::"text" [] NOT NULL,
    "is_favourite" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."favourites" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."nonces" (
    "id" "text" NOT NULL,
    "expires" timestamp with time zone DEFAULT ("now" () + '00:10:00'::interval) NOT NULL
);

ALTER TABLE "public"."nonces" OWNER TO "postgres";

ALTER TABLE ONLY "public"."favourites"
ADD CONSTRAINT "favourites_pkey" PRIMARY KEY ("wallet_address", "player_id");

ALTER TABLE ONLY "public"."nonces"
ADD CONSTRAINT "nonces_pkey" PRIMARY KEY ("id");


ALTER TABLE "public"."favourites" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."nonces" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."favourites" TO "anon";

GRANT ALL ON TABLE "public"."favourites" TO "authenticated";

GRANT ALL ON TABLE "public"."favourites" TO "service_role";

GRANT ALL ON TABLE "public"."nonces" TO "anon";

GRANT ALL ON TABLE "public"."nonces" TO "authenticated";

GRANT ALL ON TABLE "public"."nonces" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";

RESET ALL;
