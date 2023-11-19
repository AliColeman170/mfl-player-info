import { auth } from "@/auth";
import { supabaseAdmin } from "@/utils/supabase";
import { ToggleFavouriteButton } from "../Favourites/ToggleFavouriteButton";

async function getFavouriteData(playerId) {
  const session = await auth();
  const { data: favourite } = await supabaseAdmin
    .from("favourites")
    .select()
    .eq("player_id", playerId)
    .eq("wallet_address", session?.user.addr)
    .maybeSingle();
  return favourite;
}

export async function FavouriteButton({ playerId }) {
  const session = await auth();
  const favouriteData = await getFavouriteData(playerId);
  return (
    <ToggleFavouriteButton
      user={session?.user}
      playerId={playerId}
      isFavourite={favouriteData?.is_favourite || false}
      className="flex items-center justify-center space-x-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800/50 px-3 py-2 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 disabled:opacity-50 disabled:pointer-events-none"
    />
  );
}
