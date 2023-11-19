"use server";
import { auth, signIn, signOut } from "@/auth";
import { supabaseAdmin } from "@/utils/supabase";
import { CurrentUser, Service } from "@onflow/typedefs";
import { revalidatePath } from "next/cache";

export async function authenticate(credentials: CurrentUser) {
  try {
    const accountProofService = credentials.services.find(
      (services: Service) => services.type === "account-proof"
    );

    if (accountProofService) {
      const response = await fetch(`${process.env.NEXT_SITE_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          (accountProofService as Service & { data: object }).data
        ),
      });

      const verified = await response.json();

      if (!verified) throw new Error("Not verified");

      await signIn("credentials", {
        addr: credentials.addr,
      });
    }
    throw new Error("Invalid proof");
  } catch (error) {
    if ((error as Error).message.includes("CredentialsSignin")) {
      return "CredentialSignin";
    }
    throw error;
  }
}
export async function logout() {
  try {
    await signOut();
  } catch (error) {
    if ((error as Error).message.includes("CredentialsSignin")) {
      return "CredentialSignin";
    }
    throw error;
  }
}
export async function setFavourite(player_id, isFavourite) {
  try {
    const session = await auth();

    if (!session) throw Error("Not authenticated!");

    const { error } = await supabaseAdmin
      .from("favourites")
      .upsert({
        wallet_address: session.user.addr,
        player_id,
        is_favourite: isFavourite,
      })
      .select("player_id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/");
  } catch (error) {
    throw error;
  }
}
export async function deleteFavourite(player_id) {
  try {
    const session = await auth();

    if (!session) throw Error("Not authenticated!");

    const { error } = await supabaseAdmin
      .from("favourites")
      .delete()
      .eq("wallet_address", session.user.addr)
      .eq("player_id", player_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/");
  } catch (error) {
    throw error;
  }
}
export async function updateTags(player_id, updatedTags) {
  try {
    const session = await auth();

    if (!session) throw Error("Not authenticated!");

    const { error } = await supabaseAdmin
      .from("favourites")
      .upsert({
        wallet_address: session.user.addr,
        player_id,
        tags: updatedTags,
      })
      .select("player_id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/");
  } catch (error) {
    console.log(error);
    throw error;
  }
}
