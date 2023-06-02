import * as fcl from "@onflow/fcl";

fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "0xMFLPlayer": "0x8ebcbfd516b1da27"
})

export async function getPlayerData(playerID) {
  try {
    const player = await fcl.query({
      cadence: `
        import MFLPlayer from 0xMFLPlayer

        pub fun main(playerID: UInt64): MFLPlayer.PlayerData? {
            return MFLPlayer.getPlayerData(id: playerID)
        }
      `,
      args: (arg, t) => [arg(playerID, t.UInt64)]
    })
    return player;
  } catch (error) {
     throw new Error(error.message);
  }
}