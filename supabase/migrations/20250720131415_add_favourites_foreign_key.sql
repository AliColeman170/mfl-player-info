alter table "public"."favourites" add constraint "favourites_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) not valid;

alter table "public"."favourites" validate constraint "favourites_player_id_fkey";


