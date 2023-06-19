import Link from "next/link";
import MFLIcon from "../MFLIcon";

export default function Header() {
  return (
    <header className='mx-auto w-full max-w-xl px-6 lg:px-8 py-12'>
          <div className='flex items-center justify-center space-x-4'>
            <Link href="/">
                <MFLIcon className='w-32 text-slate-900 dark:text-white' />
            </Link>
            <h1 className='text-slate-900 dark:text-white border-l-2 border-slate-900 dark:border-white text-3xl font-bold tracking-tight pl-4'>
              <Link href="/">Player Info</Link>
            </h1>
          </div>
    </header>
  )
}
