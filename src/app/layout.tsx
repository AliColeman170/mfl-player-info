import './globals.css';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { UserProvider } from '@/components/Wallet/UserProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { openGraph, twitter } from './shared-meta';
import { getUser } from '@/data/auth';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/data/user';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_SITE_URL!),
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
  const supabase = await createClient();
  const user = await getUser(supabase);
  const userProfile = await getUserProfile(user?.user_metadata.address);

  return (
    <html lang='en'>
      <body
        className={`${inter.className} bg-background text-foreground flex min-h-screen flex-col`}
      >
        <UserProvider serverUser={user} userProfile={userProfile}>
          <Header />
          <main className='mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8'>
            {children}
          </main>
          <Footer />
        </UserProvider>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
