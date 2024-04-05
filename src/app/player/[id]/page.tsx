import Player from "@/components/Player";
import { getPlayerData } from "@/flow/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { openGraph, twitter } from "@/app/shared-meta";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const id = params.id;

  // fetch data
  const result = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${params.id}`
  )
    .then((res) => res.json())
    .catch();

  if (!result.player) return;

  const { firstName, lastName } = result.player?.metadata;

  const title = `${firstName} ${lastName} | #${id} | MFL Player Info`;
  const url = `${process.env.NEXT_SITE_URL}/player/${id}`;

  return {
    title,
    alternates: {
      canonical: url,
    },
    openGraph: {
      ...openGraph,
      title,
      url,
    },
    twitter: {
      ...twitter,
      title,
    },
  };
}

export default async function PlayerPage({ params }) {
  const playerId = Number(params.id ?? -1);

  if (isNaN(playerId) || playerId <= 0) notFound();

  const player = await getPlayerData(params.id);

  if (!player) notFound();

  return <Player player={player} />;
}
