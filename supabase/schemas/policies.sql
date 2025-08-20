-- Sales table policies - allow public read access
CREATE POLICY "Enable select for sales" ON "public"."sales" FOR
SELECT
    TO "authenticated",
    "anon" USING (true);

CREATE POLICY "Enable delete for users based on wallet address" ON "public"."favourites" FOR DELETE TO "authenticated" USING (
    (
        (
            SELECT
                (
                    (
                        (
                            select
                                auth.jwt ()
                        ) -> 'app_metadata'::"text"
                    ) ->> 'address'::"text"
                )
        ) = "wallet_address"
    )
);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."favourites" FOR INSERT TO "authenticated"
WITH
    CHECK (true);

CREATE POLICY "Enable select for users based on wallet address" ON "public"."favourites" FOR
SELECT
    TO "authenticated" USING (
        (
            (
                SELECT
                    (
                        (
                            (
                                select
                                    auth.jwt ()
                            ) -> 'app_metadata'::"text"
                        ) ->> 'address'::"text"
                    )
            ) = "wallet_address"
        )
    );

CREATE POLICY "Enable update for users based on wallet address" ON "public"."favourites"
FOR UPDATE
    TO "authenticated" USING (
        (
            (
                SELECT
                    (
                        (
                            (
                                select
                                    auth.jwt ()
                            ) -> 'app_metadata'::"text"
                        ) ->> 'address'::"text"
                    )
            ) = "wallet_address"
        )
    )
WITH
    CHECK (
        (
            (
                SELECT
                    (
                        (
                            (
                                select
                                    auth.jwt ()
                            ) -> 'app_metadata'::"text"
                        ) ->> 'address'::"text"
                    )
            ) = "wallet_address"
        )
    );

-- Players table policies
-- Allow read access to all users (players data is public)
CREATE POLICY "Enable read access for all users" ON "public"."players" FOR
SELECT
    USING (true);

-- Only allow service role to insert/update/delete players (sync operations)
CREATE POLICY "Enable all operations for service role" ON "public"."players" FOR ALL TO "service_role" USING (true);

CREATE POLICY "Enable select for users based on wallet address" ON "public"."upstash_workflow_executions" FOR
SELECT
    TO "authenticated" USING (
        (
            SELECT
                (
                    (
                        (
                            select
                                auth.jwt ()
                        ) -> 'app_metadata'::"text"
                    ) ->> 'address'::"text"
                )
        ) = '0xb6fbc6072df85634'
    );

create policy "Enable read access for all users" on "public"."sync_config" as PERMISSIVE for
SELECT
    to public using (true);