'use server';

import { appIdentifier, fcl } from '@/flow/api';
import { addNonce, checkNonce, removeNonce } from '@/utils/nonces';
import { createClient } from '@/utils/supabase/server';
import { CurrentUser, Service } from '@onflow/typedefs';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(credentials: CurrentUser, redirectTo?: string) {
  if (!credentials?.services)
    return { success: false, message: 'Credentials not found.' };

  const supabase = await createClient();

  console.log('Has credentials.services');

  const accountProofService = (credentials.services as any).find(
    (service: Service) => service.type === 'account-proof'
  );

  console.log('Account Proof Service Found', accountProofService);

  if (!accountProofService || !accountProofService.data)
    return { success: false, message: 'Login failed.' };

  if (!(await checkNonce(accountProofService.data.nonce))) {
    console.log('Failed to verify nonce.');
    return { success: false, message: 'Failed to verify nonce.' };
  }

  console.log('Delete nonce.');

  console.log('Verifying account proof.');
  const verified = await fcl.AppUtils.verifyAccountProof(
    appIdentifier,
    accountProofService.data
  );

  if (!verified) {
    console.log('Account proof not verified.');
    return { success: false, message: 'Account proof not verified.' };
  }

  console.log('Account proof verified successfully.');

  const { error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        address: credentials.addr,
      },
    },
  });

  if (error) {
    console.log('Error signing in anonymously.');
    return { success: false, message: error.message };
  }
  console.log('Signed in anonymously.');

  await removeNonce(accountProofService.data.nonce);
  revalidatePath('/', 'layout');
  redirect(redirectTo ?? '/');
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) return { success: false, message: error.message };

  revalidatePath('/', 'layout');
  redirect(`/`);
}

export async function generateNonce() {
  const nonce = randomBytes(32).toString('hex');
  await addNonce(nonce);

  return { success: false, nonce };
}
