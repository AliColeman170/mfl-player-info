import { Favourites } from '@/components/Favourites';
import { NotLoggedIn } from '@/components/Favourites/NotLoggedIn';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/data/auth';
import { SpinnerIcon } from '@/components/SpinnerIcon';

export const metadata: Metadata = {
  title:
    'My Favourites | MFL Player Info | Ratings Calculator & Contract Details',
};

export default async function FavouritesPage() {
  const supabase = await createClient();
  const user = getUser(supabase);

  if (!user) return <NotLoggedIn />;

  return (
    <div className='mt-4'>
      <h1 className='text-4xl font-bold'>My Favourites</h1>
      <Suspense
        fallback={
          <div className='flex h-64 items-center justify-center'>
            <SpinnerIcon className='size-8 animate-spin' />
          </div>
        }
      >
        <Favourites />
      </Suspense>
    </div>
  );
}
