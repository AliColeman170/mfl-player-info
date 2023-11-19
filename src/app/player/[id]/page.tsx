import Player from "@/components/Player";
import { getPlayerData } from "@/flow/api";
import { notFound } from "next/navigation";

export default async function PlayerPage({ params }) {
  const player = await getPlayerData(params.id);

  if (!player) notFound();

  return <Player player={player} />;
}
