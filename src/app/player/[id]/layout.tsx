import { ComboSearch } from '@/components/Search/ComboSearch';

export default async function PlayerLayout({
  params,
  children,
}: {
  params: Promise<{ id: number }>;
  children: React.ReactNode;
}) {
  const id = (await params).id;

  return (
    <div className='flex h-full flex-1 flex-col items-center justify-start space-y-8'>
      <ComboSearch key='search' id={id} autofocus={true} />
      {children}
    </div>
  );
}
