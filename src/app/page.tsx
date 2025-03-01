import { ComboSearch } from '@/components/Search/ComboSearch';
import { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: { url: 'https://mflplayer.info' },
};

export default function Home() {
  return (
    <div className='flex h-full flex-1 flex-col items-center justify-start gap-y-8'>
      <ComboSearch key='search' autofocus={true} />
    </div>
  );
}
