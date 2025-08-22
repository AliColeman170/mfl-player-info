create or replace view "public"."favourite_players" as
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.overall,
  p.primary_position,
  p.age,
  p.club_name,
  (count(f.player_id))::integer AS favorite_count
FROM
  (
    players p
    JOIN favourites f ON ((p.id = f.player_id))
  )
WHERE
  (f.is_favourite = true)
GROUP BY
  p.id,
  p.first_name,
  p.last_name,
  p.overall,
  p.primary_position,
  p.age,
  p.club_name;
