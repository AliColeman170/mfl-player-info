'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PlayerLinkProps {
  playerId: number;
  children: React.ReactNode;
  className?: string;
}

export function PlayerLink({ playerId, children, className }: PlayerLinkProps) {
  const searchParams = useSearchParams();

  // Preserve current search params when navigating to player
  const href = `/player/${playerId}${searchParams ? `?${searchParams.toString()}` : null}`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
