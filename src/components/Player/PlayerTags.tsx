import { auth } from "@/auth";
import { supabaseAdmin } from "@/utils/supabase";
import { TagsList } from "../Tags/TagsList";

export async function PlayerTags({ player }) {
  const session = await auth();
  const { data: favourite } = await supabaseAdmin
    .from("favourites")
    .select()
    .eq("player_id", player.id)
    .eq("wallet_address", session?.user.addr)
    .maybeSingle();

  if (!favourite) return null;
  return (
    <div className="px-1 py-1.5 @[16rem]/inner:py-2 grid @[10rem]/inner:grid-cols-3 @[10rem]/inner:gap-8 @[16rem]/inner:px-0">
      <dt className="text-xs @[16rem]/inner:text-base font-semibold leading-none text-slate-700 dark:text-slate-400 uppercase flex items-center space-x-2">
        <span>Tags</span>
      </dt>
      <dd className="text-sm @[16rem]/inner:text-base leading-none text-slate-700 dark:text-slate-200 text-left @[10rem]/inner:text-right col-span-2 capitalize flex items-center @[10rem]/inner:justify-end">
        <TagsList
          wrap={true}
          user={session.user}
          player={{ ...favourite, id: favourite.player_id }}
        />
      </dd>
    </div>
  );
}
