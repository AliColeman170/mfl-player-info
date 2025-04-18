import Player from '@/components/Player';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { openGraph, twitter } from '@/app/shared-meta';
import { getPlayerById } from '@/data/players';

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const experimental_ppr = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;

  // fetch data
  const player = await getPlayerById(id);

  if (!player) return notFound();

  const { firstName, lastName } = player.metadata;

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

export default async function PlayerPage({ params }: Props) {
  const id = (await params).id;

  const player = await getPlayerById(id);

  if (!player) notFound();

  return <Player player={player} />;
}
