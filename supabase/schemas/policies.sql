CREATE POLICY "Enable delete for users based on wallet address" ON "public"."favourites" FOR DELETE TO "authenticated" USING (
    (
        (
            SELECT
                (
                    ("auth"."jwt" () -> 'app_metadata'::"text") ->> 'address'::"text"
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
                        ("auth"."jwt" () -> 'app_metadata'::"text") ->> 'address'::"text"
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
                        ("auth"."jwt" () -> 'app_metadata'::"text") ->> 'address'::"text"
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
                        ("auth"."jwt" () -> 'app_metadata'::"text") ->> 'address'::"text"
                    )
            ) = "wallet_address"
        )
    );