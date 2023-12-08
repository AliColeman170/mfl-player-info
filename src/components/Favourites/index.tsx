import { Table } from "../Table";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/utils/supabase";
import { getPlayersData } from "@/flow/api";
import { getPlayerPositionRatings } from "@/utils/helpers";

async function getFavourites() {
  const session = await auth();
  const { data: favourites, error } = await supabaseAdmin
    .from("favourites")
    .select()
    .eq("wallet_address", session.user.addr);

  if (error) throw new Error("Failed to fetch favourites");

  const myFavourites = await getPlayersData(
    favourites.map((fav) => fav.player_id.toString())
  );

  const playersWithFavData = myFavourites.map((fav) => {
    const fave = favourites.find(
      (f) => parseInt(f.player_id) == parseInt(fav.id)
    );

    return {
      ...fav,
      positionRatings: getPlayerPositionRatings(fav, true),
      is_favourite: fave.is_favourite,
      tags: fave.tags,
    };
  });

  if (error) throw new Error(error.message);
  return playersWithFavData;
}

export default async function Favourites() {
  const session = await auth();
  const favourites = await getFavourites();

  return <Table user={session?.user} players={favourites} />;
}
