import { ClientComparePage } from '@/components/Compare/ClientComparePage';
import type { Metadata } from 'next';
import { openGraph, twitter } from '../shared-meta';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const player1Id = parseInt(searchParams.player1 as string) || 0;
  const player2Id = parseInt(searchParams.player2 as string) || 0;

  let title = 'Player Comparison | MFL Player Info';
  let url = `${process.env.NEXT_SITE_URL}/compare`;

  if (player1Id && player2Id) {
    // Get player names from database for metadata
    const supabase = await createClient();
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name')
      .in('id', [player1Id, player2Id]);

    if (players && players.length === 2) {
      const player1 = players.find(p => p.id === player1Id);
      const player2 = players.find(p => p.id === player2Id);
      
      if (player1 && player2) {
        const player1Name = `${player1.first_name} ${player1.last_name}`;
        const player2Name = `${player2.first_name} ${player2.last_name}`;
        title = `${player1Name} vs ${player2Name} | Player Comparison | MFL Player Info`;
        url = `${process.env.NEXT_SITE_URL}/compare?player1=${player1Id}&player2=${player2Id}`;
      }
    }
  }

  return {
    title,
    alternates: {
      canonical: url,
    },
    openGraph: {
      ...openGraph,
      title,
      url,
      ...(player1Id && player2Id && {
        images: [
          {
            url: `${process.env.NEXT_SITE_URL}/compare/og-image?player1=${player1Id}&player2=${player2Id}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      ...twitter,
      title,
      ...(player1Id && player2Id && {
        images: [
          {
            url: `${process.env.NEXT_SITE_URL}/compare/og-image?player1=${player1Id}&player2=${player2Id}`,
            alt: title,
            width: 1200,
            height: 670,
          },
        ],
      }),
    },
  };
}

export default function ComparePage() {
  return <ClientComparePage />;
}
