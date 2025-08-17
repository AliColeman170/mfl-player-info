import { ClientPlayerPage } from '@/components/Player/ClientPlayerPage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { openGraph, twitter } from '@/app/shared-meta';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const experimental_ppr = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt((await params).id, 10);

  // Minimal fetch for metadata - just get basic player info
  const supabase = await createClient();
  const { data: player } = await supabase
    .from('players')
    .select('first_name, last_name')
    .eq('id', id)
    .single();

  if (!player) return notFound();

  const title = `${player.first_name} ${player.last_name} | #${id} | MFL Player Info`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/player/${id}`;

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
  const id = parseInt((await params).id, 10);

  return <ClientPlayerPage playerId={id} />;
}
