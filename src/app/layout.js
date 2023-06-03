import Search from '@/components/Search'
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MFL Player Ratings Calculator',
  description: 'Calculate the overall rating for any Metaverse Football League (MFL) player in every position using their player ID.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex flex-1 h-full flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-4 space-y-8">
          <Search />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
