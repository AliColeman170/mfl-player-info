'use server';

import { getUser } from '@/data/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setFavourite(player_id: number, isFavourite: boolean) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) throw Error('Not authenticated!');

  const { error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.app_metadata.address,
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

  // Update is_favourite to false instead of deleting the record
  // This preserves tags and other data
  const { error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.app_metadata.address,
      player_id,
      is_favourite: false,
    })
    .select('player_id')
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath('/');
  return { success: true, message: 'Favourite removed!' };
}

export async function updateTags(player_id: number, updatedTags: string[]) {
  const supabase = await createClient();
  const user = await getUser(supabase);

  if (!user) throw Error('Not authenticated!');

  const { error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.app_metadata.address,
      player_id,
      tags: updatedTags,
    })
    .select('player_id')
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath('/');
  return { success: true, message: 'Tags updated!' };
}
