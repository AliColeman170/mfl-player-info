import 'server-only';

import { admin as supabase } from './supabase/admin';

export async function addNonce(nonce: string) {
  const { data: nonces } = await supabase
    .from('nonces')
    .insert({ id: nonce })
    .select()
    .throwOnError();

  process.env.DEBUG && console.log('Nonces after adding: ', nonces);
}

export async function checkNonce(nonce: string) {
  const { data: nonces } = await supabase
    .from('nonces')
    .select('id')
    .gte('expires', new Date().toISOString());

  process.env.DEBUG && console.log('Nonce: ', nonce);
  process.env.DEBUG && console.log('Nonces: ', nonces);
  process.env.DEBUG &&
    console.log(
      'Nonce check: ',
      (nonces?.map((n) => n.id) ?? []).includes(nonce)
    );
  return (nonces?.map((n) => n.id) ?? []).includes(nonce);
}

export async function removeNonce(nonce: string) {
  await supabase.from('nonces').delete().eq('id', nonce).select();
  const { data: nonces } = await supabase.from('nonces').select();
  process.env.DEBUG && console.log('Nonces after removing: ', nonces);
}
