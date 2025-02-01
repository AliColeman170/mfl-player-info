'use server';

import { getUser } from '@/data/auth';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setFavourite(player_id: number, isFavourite: boolean) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) throw Error('Not authenticated!');

  const { error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.user_metadata.address,
      player_id,
      is_favourite: isFavourite,
    })
    .select('player_id')
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath('/');
  return { success: true, message: 'Favourite updated!' };
}

export async function deleteFavourite(player_id: number) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) throw Error('Not authenticated!');

  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('wallet_address', user.user_metadata.address)
    .eq('player_id', player_id)
    .select()
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath('/');
  return { success: true, message: 'Favourite deleted!' };
}

export async function updateTags(player_id: number, updatedTags: string[]) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) throw Error('Not authenticated!');

  const { error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.user_metadata.address,
      player_id,
      tags: updatedTags,
    })
    .select('player_id')
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath('/');
  return { success: true, message: 'Tags updated!' };
}
