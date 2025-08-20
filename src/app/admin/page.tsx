import type { Metadata } from 'next';
import { getUser } from '@/data/auth';
import { createClient } from '@/lib/supabase/server';
import { UpstashWorkflowControls } from '@/components/Dashboard/UpstashWorkflowControls';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  alternates: {
    canonical: '/admin',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default async function Home() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  const isAdmin = user?.app_metadata?.address === '0xb6fbc6072df85634';

  if (!isAdmin) notFound();

  return (
    <div className='container mx-auto flex flex-col gap-y-8'>
      {/* Sync Status - Full width - Admin only */}
      {isAdmin && (
        <div className='lg:col-span-12'>
          <UpstashWorkflowControls />
        </div>
      )}
    </div>
  );
}
