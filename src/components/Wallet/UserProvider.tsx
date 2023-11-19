"use client";

import { fcl, getPlayersData } from "@/flow/api";
import { getPlayerPositionRatings } from "@/utils/helpers";
import { createContext, useContext, useEffect, useState } from "react";

// type UserContextType = {
//   user: CurrentUser;
//   players: Array<>
// };

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({ loggedIn: null, addr: "" });
  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  // useEffect(() => {
  //   async function fetchPlayers() {
  //     const LIMIT = 400;
  //     let page = 1;
  //     let players = [];

  //     const res = await fetch(
  //       `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?ownerWalletAddress=${user.addr}&limit=${LIMIT}`
  //     );
  //     const retrievedPlayers = await res.json();
  //     players.push(...retrievedPlayers);

  //     while (page * LIMIT === players.length) {
  //       const res = await fetch(
  //         `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?ownerWalletAddress=${
  //           user.addr
  //         }&limit=${LIMIT}&beforePlayerId=${players[players.length - 1].id}`
  //       );
  //       const retrievedPlayers = await res.json();
  //       players.push(...retrievedPlayers);
  //       page++;
  //     }
  //     const playersWithPositionalData = players.map((player) => {
  //       return {
  //         ...player,
  //         positionRatings: getPlayerPositionRatings(player),
  //       };
  //     });
  //     setPlayers(playersWithPositionalData);
  //   }
  // async function fetchFavourites() {
  //   const response = await fetch(`/api/users/${user.addr}/favourites`);
  //   const result = await response.json();
  //   const myFavourites = await getPlayersData(
  //     result.favourites.map((fav) => fav.player_id.toString())
  //   );
  //   const playersWithFavData = myFavourites.map((fav) => {
  //     const fave = result.favourites.find(
  //       (f) => parseInt(f.player_id) == parseInt(fav.id)
  //     );
  //     return {
  //       ...fav,
  //       positionRatings: getPlayerPositionRatings(fav),
  //       isFavourite: !!fave,
  //       tags: fave?.tags,
  //     };
  //   });
  //   setFavourites(playersWithFavData);
  //}
  //   if (user.loggedIn) {
  //     fetchPlayers();
  //     fetchFavourites();
  //   }
  // }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        // players,
        // setPlayers,
        // favourites,
        // setFavourites,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error("useUser has to be used within <UserContext.Provider>");
  }
  return userContext;
};
