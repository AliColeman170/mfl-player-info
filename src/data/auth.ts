import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export const getUser = async (supabase: SupabaseClient<Database>) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
