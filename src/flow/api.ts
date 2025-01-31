import { generateNonce } from '@/actions/auth';
import * as fcl from '@onflow/fcl';

export const appIdentifier = 'MFLPlayerInfo';

const accountProofDataResolver = async () => {
  const { nonce } = await generateNonce();
  return {
    appIdentifier,
    nonce,
  };
};

fcl.config({
  'flow.network': 'mainnet',
  'accessNode.api': 'https://rest-mainnet.onflow.org',
  'discovery.wallet': `https://fcl-discovery.onflow.org/authn`,
  'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
  'discovery.authn.include': ['0xead892083b3e2c6c'],
  '0xMFLPlayer': '0x8ebcbfd516b1da27',
  'fcl.accountProof.resolver': accountProofDataResolver,
  'walletconnect.projectId': '95eec771b08847aea13eff14792fe727',
});

export { fcl };

export async function getPlayerData(playerID: number) {
  try {
    if (!playerID) throw new Error('No player ID provided');
    if (isNaN(playerID) || playerID <= 0) throw new Error('Invalid player ID');
    const player = await fcl.query({
      cadence: `
        import MFLPlayer from 0xMFLPlayer

        access(all) fun main(playerID: UInt64): MFLPlayer.PlayerData? {
            return MFLPlayer.getPlayerData(id: playerID)
        }
      `,
      args: (arg: any, t: any) => [arg(playerID, t.UInt64)],
    });
    return player;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getPlayersData(playersIds: number[]) {
  try {
    const players = await fcl.query({
      cadence: `
        import MFLPlayer from 0xMFLPlayer

        access(all) fun main(playersIds: [UInt64]): [MFLPlayer.PlayerData] {
          let playersData: [MFLPlayer.PlayerData] = []
          for id in playersIds {
              if let playerData = MFLPlayer.getPlayerData(id: id) {
                  playersData.append(playerData)
              }
          }
          return playersData
        }
      `,
      args: (arg: any, t: any) => [arg(playersIds, t.Array(t.UInt64))],
    });
    return players;
  } catch (error) {
    console.log(error);
    return null;
  }
}
