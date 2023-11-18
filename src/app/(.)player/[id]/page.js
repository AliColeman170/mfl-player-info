import Player from '@/components/Player';
import Search from '@/components/Search';
import { getPlayerData } from '@/flow/api';
import { notFound } from 'next/navigation';

export default async function PlayerPage({ params }) {
  const player = await getPlayerData(params.id);

  if (!player) notFound();

  return (
    <div className="flex flex-1 h-full flex-col items-center justify-start space-y-8">
      <Search />
      <Player player={player} />
    </div>
  );
}
