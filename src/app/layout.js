import Search from '@/components/Search'
import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MFL Player Ratings Calculator',
  description: 'Calculate the overall rating for any Metaverse Football League (MFL) player in every position using their player ID.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className='mx-auto w-full max-w-xl px-6 lg:px-8 py-12'>
          <div className='flex items-center justify-center space-x-4'>
            <Link href="/">
              <svg className='w-32 text-slate-900 dark:text-white' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55.541065 17.780001" fill="currentColor">
                <g transform="translate(227.49086,-63.017615)">
                  <path d="m -202.64966,63.017615 -3.5052,17.78 h -5.461 l 1.5748,-8.1026 -5.0038,6.5024 h -2.6416 l -2.7432,-6.4008 -1.6002,8.001 h -5.461 l 3.556,-17.78 h 4.8768 l 3.8608,9.4488 7.4422,-9.4488 z" strokeWidth="0.26458332"></path>
                  <path d="m -194.64548,67.538815 -0.6096,3.048 h 7.4168 l -0.9144,4.5212 h -7.3914 l -1.143,5.6896 h -5.9944 l 3.556,-17.78 h 14.4526 l -0.9144,4.5212 z" strokeWidth="0.26458332"></path>
                  <path d="m -183.35439,63.017615 h 5.9944 l -2.6162,13.1318 h 8.0264 l -0.9398,4.6482 h -14.0208 z" strokeWidth="0.26458332"></path>
                </g>
              </svg>
            </Link>
            <h1 className='text-slate-900 dark:text-white border-l-2 border-slate-900 dark:border-white text-3xl font-bold tracking-tight pl-4'>
              <Link href="/">Ratings Calculator</Link>
            </h1>
          </div>
        </header>
        <main className="flex flex-1 h-full flex-col items-center justify-start px-6 lg:px-8 py-4 space-y-8">
          <Search />
          {children}
        </main>
        <footer className='mx-auto w-full max-w-xl px-6 lg:px-8 py-8 flex justify-center'>
          <p className='text-sm text-slate-600'>Built by <a href="https://twitter.com/alicoleman170" target='_blank' className='text-slate-500 hover:text-slate-400'>@AliColeman170</a>.</p>
        </footer>
      </body>
    </html>
  )
}
