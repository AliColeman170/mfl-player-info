import { MFLUser } from '@/types/global.types';

export const getUserProfile = async (address: string) => {
  const userProfile: MFLUser = await fetch(
    `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/users/${address}/public`,
    {
      cache: 'force-cache',
      next: { tags: [`user/${address}`], revalidate: 3600 },
    }
  ).then((res) => res.json());

  if (!userProfile.walletAddress) return null;

  return userProfile;
};
