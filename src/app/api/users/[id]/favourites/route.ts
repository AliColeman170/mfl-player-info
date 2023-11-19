import { supabaseAdmin } from "@/utils/supabase";

export async function GET(_, { params }) {
  const wallet_address = params.id;
  try {
    if (!wallet_address) throw new Error("You must be logged in!");
    const { data: favourites, error } = await supabaseAdmin
      .from("favourites")
      .select("*")
      .eq("wallet_address", wallet_address);
    if (error) throw new Error(error.message);
    return Response.json({ success: true, favourites });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}

export async function POST(request, { params }) {
  const wallet_address = params.id;
  const res = await request.json();
  const player_id = res.player_id;
  const isFavourite = res.isFavourite;
  const tags = res.tags;

  try {
    if (!wallet_address) throw new Error("You must be logged in!");
    const { data: newFavourite, error } = await supabaseAdmin
      .from("favourites")
      .upsert({ wallet_address, player_id, isFavourite, tags })
      .select("player_id")
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ success: true, player: newFavourite.player_id });
  } catch (e) {
    return Response.json({ success: false });
  }
}

export async function DELETE(request, { params }) {
  const wallet_address = params.id;
  const res = await request.json();
  const player_id = res.player_id;

  try {
    if (!wallet_address) throw new Error("You must be logged in!");
    const { data: deletedFavourite, error } = await supabaseAdmin
      .from("favourites")
      .delete()
      .eq("wallet_address", wallet_address)
      .eq("player_id", player_id)
      .select("player_id")
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ success: true, player: deletedFavourite.player_id });
  } catch (e) {
    return Response.json({ success: false });
  }
}
