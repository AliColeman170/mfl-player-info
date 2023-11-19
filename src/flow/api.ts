import * as fcl from "@onflow/fcl";

const accountProofDataResolver = async () => {
  const response = await fetch("/api/generate");
  const { nonce } = await response.json();
  return {
    appIdentifier: "MFLPlayerInfo",
    nonce,
  };
};

fcl.config({
  "flow.network": "mainnet",
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "discovery.wallet": `https://fcl-discovery.onflow.org/authn`,
  "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/authn",
  "discovery.authn.include": ["0xead892083b3e2c6c"],
  "0xMFLPlayer": "0x8ebcbfd516b1da27",
  "fcl.accountProof.resolver": accountProofDataResolver,
});

export { fcl };

export async function getPlayerData(playerID) {
  try {
    const player = await fcl.query({
      cadence: `
        import MFLPlayer from 0xMFLPlayer

        pub fun main(playerID: UInt64): MFLPlayer.PlayerData? {
            return MFLPlayer.getPlayerData(id: playerID)
        }
      `,
      args: (arg, t) => [arg(playerID, t.UInt64)],
    });
    return player;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getPlayersData(playersIds) {
  try {
    const players = await fcl.query({
      cadence: `
        import MFLPlayer from 0xMFLPlayer

        pub fun main(playersIds: [UInt64]): [MFLPlayer.PlayerData] {
          let playersData: [MFLPlayer.PlayerData] = []
          for id in playersIds {
              if let playerData = MFLPlayer.getPlayerData(id: id) {
                  playersData.append(playerData)
              }
          }
          return playersData
        }
      `,
      args: (arg, t) => [arg(playersIds, t.Array(t.UInt64))],
    });
    return players;
  } catch (error) {
    throw new Error(error.message);
  }
}
