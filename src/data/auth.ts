import { Database } from '@/types/database.types';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { getUserProfile } from './user';

export const getUser = cache(async (supabase: SupabaseClient<Database>) => {
  const { data } = await supabase.auth.getClaims();

  return data?.claims;
});

export const getAuthUserProfile = async () => {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) return null;

  const userProfile = await getUserProfile(user?.app_metadata.address);

  if (!userProfile) return null;

  return { user, profile: userProfile };
};

export type AuthUserProfile = Awaited<ReturnType<typeof getAuthUserProfile>>;
