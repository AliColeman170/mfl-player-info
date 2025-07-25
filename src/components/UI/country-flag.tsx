import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CountryFlagProps {
  country: string;
  className?: string;
  size?: number;
}

export function CountryFlag({ country, className }: CountryFlagProps) {
  if (!country) {
    return null;
  }

  return (
    <Image
      src={`https://app.playmfl.com/img/flags/${country}.svg`}
      alt={`${country} flag`}
      height={64}
      width={48}
      className={cn('inline-block w-4', className)}
      unoptimized
    />
  );
}
