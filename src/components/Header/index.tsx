import Link from 'next/link';
import { MFLIcon } from '../MFLIcon';
import { Wallet } from '../Wallet';

export function Header() {
  return (
    <header className='mb-8 border-b border-slate-200 dark:border-slate-800'>
      <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
        <div className='flex items-center justify-between sm:grid sm:grid-cols-[50px_1fr_50px]'>
          <div className='hidden sm:block'></div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4'>
            <Link href='/'>
              <MFLIcon className='w-16 text-slate-900 sm:w-24 dark:text-white' />
            </Link>
            <h1 className='mt-0.5 border-slate-900 text-lg font-bold leading-4 tracking-tight text-slate-900 sm:mt-0 sm:border-l-2 sm:pl-4 sm:text-2xl dark:border-white dark:text-white'>
              <Link href='/'>Player Info</Link>
            </h1>
          </div>
          <div>
            <Wallet />
          </div>
        </div>
      </div>
    </header>
  );
}
