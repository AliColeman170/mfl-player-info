import { PlayerComparison } from '@/components/Compare/PlayerComparison';
import { ComparePlayerSearch } from '@/components/Search/ComparePlayerSearch';
import type { Metadata } from 'next';
import { openGraph, twitter } from '../shared-meta';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const searchParams = await props.searchParams;
  // read route params
  const player1Id = searchParams.player1 || '';
  const player2Id = searchParams.player2 || '';

  // fetch data
  const player1 = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${player1Id}`
  ).then((res) => res.json());

  const player2 = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${player2Id}`
  ).then((res) => res.json());

  const player1Name = player1.player
    ? `${player1.player.metadata.firstName} ${player1.player.metadata.lastName}`
    : '???';
  const player2Name = player2.player
    ? `${player2.player.metadata.firstName} ${player2.player.metadata.lastName}`
    : '???';

  const title = `${player1Name} v ${player2Name} | Player Comparison | MFL Player Info`;
  const url = `${process.env.NEXT_SITE_URL}/compare?player1=${player1Id}&player2=${player2Id}`;

  return {
    title,
    alternates: {
      canonical: url,
    },
    openGraph: {
      ...openGraph,
      title,
      url,
      images: [
        {
          url: `${process.env.NEXT_SITE_URL}/compare/og-image?player1=${player1Id}&player2=${player2Id}`,
          width: 1200,
          height: 630,
          alt: `${title}`,
        },
      ],
    },
    twitter: {
      ...twitter,
      title,
      images: [
        {
          url: `${process.env.NEXT_SITE_URL}/compare/og-image?player1=${player1Id}&player2=${player2Id}`,
          alt: `${title}`,
          width: 1200,
          height: 670,
        },
      ],
    },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ player1: number; player2: number }>;
}) {
  const player1Id = (await searchParams).player1;
  const player2Id = (await searchParams).player2;

  return (
    <div className='flex h-full flex-1 flex-col items-center justify-start space-y-4 md:space-y-8'>
      <ComparePlayerSearch
        key={`player1=${player1Id}&player2=${player2Id}`}
        player1={player1Id}
        player2={player2Id}
      />
      <Suspense>
        <PlayerComparison
          key={`compare/player1=${player1Id}&player2=${player2Id}`}
          player1Id={player1Id}
          player2Id={player2Id}
        />
      </Suspense>
    </div>
  );
}
