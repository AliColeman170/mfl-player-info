import Link from 'next/link';

async function getContractData(id) {
  const playerData = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${id}`
  ).then((res) => res.json());

  if (playerData.player.activeContract) return playerData.player.activeContract;

  return null;
}

export async function PlayerContract({ player }) {
  const contractData = await getContractData(player);
  if (!contractData)
    return (
      <div className='group relative rounded bg-slate-100 px-2 py-1.5 text-[10px] font-semibold leading-none text-slate-700 ring-1 ring-inset ring-indigo-600 ring-opacity-10 dark:bg-gray-800 dark:text-white'>
        Free Agent
      </div>
    );

  return (
    <Link
      href={`https://app.playmfl.com/clubs/${contractData.club.id}`}
      style={{
        backgroundColor: contractData.club.mainColor,
      }}
      className='group relative flex items-center gap-1.5 truncate rounded px-2 py-1.5 text-[10px]'
    >
      <img
        src={`https://d13e14gtps4iwl.cloudfront.net/u/clubs/${contractData.club.id}/logo.png?v=1`}
        className='h-3.5 w-3.5'
      />
      <span
        style={{
          color: contractData.club.mainColor,
        }}
        className='truncate font-medium leading-snug contrast-[999] grayscale invert'
      >
        {contractData.club.name}
      </span>
    </Link>
  );
}
