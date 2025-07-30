import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { cn } from '@/utils/helpers';

export function StyledRatingValue({
  rating,
  size = 'md',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const tier = getTierFromOverall(rating);
  const tierClasses = getTierClasses(tier);

  const sizeVariants = {
    sm: 'size-8 text-sm',
    md: 'size-10 text-base',
    lg: 'size-12 text-lg',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border p-1 text-center font-semibold',
        sizeVariants[size],
        tierClasses
      )}
    >
      {rating > 0 ? rating : 0}
    </div>
  );
}
