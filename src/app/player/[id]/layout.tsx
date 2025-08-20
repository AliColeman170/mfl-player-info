import { notFound } from 'next/navigation';

export default async function PlayerLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const id = (await params).id;

  if (!id) notFound();

  return (
    <div className='flex h-full flex-1 flex-col items-center justify-start space-y-8'>
      {children}
    </div>
  );
}
