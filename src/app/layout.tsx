import './globals.css';
import { Titillium_Web } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { UserProvider } from '@/components/Wallet/UserProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { openGraph, twitter } from './shared-meta';
import { getAuthUserProfile } from '@/data/auth';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/UI/card';
import { Loader2Icon } from 'lucide-react';

const titilliumWeb = Titillium_Web({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: 'MFL Player Info | Ratings Calculator & Contract Details',
  description:
    'Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.',
  keywords: [
    'MFL',
    '@playMFL',
    'Metaverse',
    'Football',
    'league',
    'football',
    'calculator',
    'player',
    'ratings',
  ],
  authors: [
    { name: 'Ali Coleman', url: 'https://www.twitter.com/alicoleman170' },
  ],
  applicationName: 'MFL Player Info',
  creator: 'Ali Coleman',
  publisher: 'Ali Coleman',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph,
  twitter,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userPromise = getAuthUserProfile();
  const userData = await userPromise;

  const supabase = await createClient();

  const { data } = await supabase
    .from('sync_config')
    .select('config_value')
    .eq('config_key', 'initial_sync_in_progress')
    .single();

  return (
    <html lang='en'>
      <body
        className={`${titilliumWeb.className} bg-background text-foreground flex min-h-screen flex-col`}
      >
        {data?.config_value === '1' &&
        userData?.user.app_metadata.address !== '0xb6fbc6072df85634' ? (
          <div className='grid flex-1 items-center justify-center'>
            <Card className='max-w-auto w-full max-w-96 sm:gap-4'>
              <CardHeader className='items-center justify-center'>
                <div className='flex justify-center'>
                  <Loader2Icon className='text-primary animate-spin' />
                </div>
                <h1 className='mt-2 text-center font-bold'>
                  Something New is Coming...
                </h1>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-center text-sm'>
                  Setting up initial data for website - this may take some time.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <QueryProvider>
            <UserProvider userPromise={userPromise}>
              <NuqsAdapter>
                <Header />
                <main className='mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8'>
                  {children}
                </main>
                <Footer />
              </NuqsAdapter>
            </UserProvider>
          </QueryProvider>
        )}
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
