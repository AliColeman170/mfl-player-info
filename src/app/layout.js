import Search from '@/components/Search'
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MFL Player Info | Ratings Calculator & Contract Details',
  description: 'Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.',
  keywords: ['MFL', '@playMFL', 'Metaverse', 'Football', 'league', 'football', 'calculator', 'player', 'ratings'],
  authors: [{ name: 'Ali Coleman', url: 'https://www.twitter.com/alicoleman170' }],
  applicationName: 'MFL Player Info',
  creator: 'Ali Coleman',
  publisher: 'Ali Coleman',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
   openGraph: {
    title: 'MFL Player Info',
    description: 'Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.',
    url: 'https://mflplayer.info',
    siteName: 'MFL Player Info',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MFL Player Info',
    description: 'Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.',
    site: '@alicoleman170',
    creator: '@alicoleman170'
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex flex-1 h-full flex-col items-center justify-start px-4 sm:px-6 lg:px-8 space-y-8">
          <Search />
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
