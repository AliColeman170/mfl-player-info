import ConnectButton from './ConnectButton';
import { UserProfile } from './UserProfile';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/data/auth';
import { getUserProfile } from '@/data/user';

export async function Wallet() {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) return <ConnectButton />;

  const userProfile = await getUserProfile(user.user_metadata.address);

  return <UserProfile user={user} userProfile={userProfile} />;
}
