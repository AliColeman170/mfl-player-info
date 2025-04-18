import Link from 'next/link';
import { MFLIcon } from '../MFLIcon';
import { Wallet } from '../Wallet';
import { Suspense } from 'react';
import { Button } from '../UI/Button';
import { SpinnerIcon } from '../SpinnerIcon';

export function Header() {
  return (
    <header className='border-border mb-8 border-b'>
      <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
        <div className='flex items-center justify-between sm:grid sm:grid-cols-[50px_1fr_50px]'>
          <div className='hidden sm:block'></div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-4'>
            <Link href='/'>
              <MFLIcon className='w-16 sm:w-24' />
            </Link>
            <h1 className='border-foreground mt-0.5 text-lg leading-4 font-bold tracking-tight sm:mt-0 sm:border-l-2 sm:pl-4 sm:text-2xl'>
              <Link href='/'>Player Info</Link>
            </h1>
          </div>
          <div>
            <Suspense
              fallback={
                <Button size='lg' disabled>
                  <SpinnerIcon className='animate-spin' />
                </Button>
              }
            >
              <Wallet />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
