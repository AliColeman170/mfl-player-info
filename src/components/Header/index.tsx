import Link from 'next/link';
import { MFLIcon } from '../MFLIcon';
import { Wallet } from '../Wallet';
import { Suspense } from 'react';
import { Button } from '../UI/button';
import { CommandMenu } from '../Search/CommandMenu';
import { Loader2Icon } from 'lucide-react';

export function Header() {
  return (
    <header className='border-border mb-8 border-b'>
      <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-[auto_1fr_auto] items-center justify-start gap-6 sm:grid-cols-[1fr_auto_auto] lg:grid-cols-[60px_1fr_60px]'>
          <div className='flex items-center justify-start'>
            <div className='relative isolate flex flex-col items-center justify-start gap-0.5'>
              <Link href='/' className='absolute inset-0 z-1 size-full'></Link>
              <MFLIcon className='h-4 translate-x-0.5' />
              <h1 className='text-foreground text-xs/3 font-semibold italic'>
                <Link href='/'>Player Info</Link>
              </h1>
            </div>
          </div>

          {/* Search - hidden on mobile, shown on tablet+ */}
          <div className='mx-auto w-full max-w-xl flex-1'>
            <CommandMenu />
          </div>

          <div className='flex items-center justify-end gap-4'>
            <Suspense
              fallback={
                <Button disabled>
                  <Loader2Icon className='animate-spin' />
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
