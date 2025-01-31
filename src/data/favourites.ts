import 'server-only';

import { Player } from '@/types/global.types';
import { cache } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getUser } from './auth';

export const getFavouriteByPlayer = cache(
  async (supabase: SupabaseClient<Database>, player: Player) => {
    const user = await getUser(supabase);

    if (!user?.user_metadata.address) return null;

    const { data: favourite } = await supabase
      .from('favourites')
      .select()
      .eq('player_id', player.id)
      .eq('wallet_address', user.user_metadata.address)
      .maybeSingle();

    return favourite;
  }
);

export const getFavourites = cache(
  async (supabase: SupabaseClient<Database>) => {
    const user = await getUser(supabase);

    if (!user?.user_metadata.address) return [];

    const { data: favourites } = await supabase
      .from('favourites')
      .select()
      .eq('wallet_address', user.user_metadata.address);

    return favourites;
  }
);
