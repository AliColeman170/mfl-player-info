import { auth } from "@/auth";
import { Table } from "@/components/Table";
import { fcl } from "@/flow/api";
import { getPlayerPositionRatings } from "@/utils/helpers";
import { supabaseAdmin } from "@/utils/supabase";
import { notFound } from "next/navigation";

import { Metadata } from "next";
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";
import MFLIcon from "@/components/MFLIcon";
import Link from "next/link";
import Image from "next/image";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  const user = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/users/${id}/public`
  ).then((res) => res.json());
  return {
    title: `${
      user && user.dapperData ? user.dapperData.username : id
    } | MFL Player Info | Ratings Calculator & Contract Details`,
  };
}

async function fetchUserData(id) {
  const user = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/users/${id}/public`
  ).then((res) => res.json());
  return user;
}

async function fetchPlayers(address) {
  try {
    await fcl.account(address);

    const session = await auth();
    const { data: favourites, error } = await supabaseAdmin
      .from("favourites")
      .select()
      .eq("wallet_address", session?.user.addr);

    if (error) throw new Error("Failed to fetch favourites");

    const LIMIT = 400;
    let page = 0;
    let hasChecked = false;
    let players = [];

    while (page * LIMIT === players.length && !hasChecked) {
      const query = hasChecked
        ? `&beforePlayerId=${players[players.length - 1].id}`
        : "";
      const res = await fetch(
        `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?ownerWalletAddress=${address}&limit=${LIMIT}${query}`
      );
      const retrievedPlayers = await res.json();
      players.push(...retrievedPlayers);
      page++;
      hasChecked = true;
    }

    const playersWithAdditionalData = players.map((player) => {
      const faveData = favourites.find((fave) => fave.player_id === player.id);
      return {
        ...player,
        positionRatings: getPlayerPositionRatings(player),
        is_favourite: faveData?.is_favourite ?? undefined,
        tags: faveData?.tags ?? undefined,
      };
    });

    return playersWithAdditionalData;
  } catch (error) {
    console.log(error);
  }
}

export default async function UserPage({ params }) {
  const session = await auth();
  const players = await fetchPlayers(params.id);
  const user = await fetchUserData(params.id);

  if (!players) notFound();

  return (
    <div className="mt-4">
      {user && user.dapperData ? (
        <div className="flex items-start space-x-4">
          <Image
            className="h-12 w-12 rounded-full"
            src={user.dapperData.image}
            alt={
              user.name
                ? user.name
                : user.dapperData?.username
                ? user.dapperData?.username
                : user.addr
            }
            unoptimized
          />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              {user.name
                ? user.name
                : user.dapperData?.username
                ? user.dapperData?.username
                : params.id}
            </h1>
            <div className="flex items-center space-x-2">
              <div className="inline-flex text-white items-center space-x-2 bg-indigo-600 py-1 px-3 rounded-md">
                <WalletIcon className="h-4 w-4" />
                <span className="text-xs">{params.id}</span>
              </div>
              <Link
                href={`https://app.playmfl.com/users/{params.id}`}
                className="px-2 rounded-md text-white flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-900/60 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                <MFLIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <h1 className="text-4xl font-bold">{params.id}</h1>
      )}
      <Table user={session?.user} players={players} />
    </div>
  );
}
