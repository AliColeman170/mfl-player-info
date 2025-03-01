import { getRarityClassNames } from '@/utils/helpers';

export function StyledRatingValue({ rating }: { rating: number }) {
  return (
    <div
      className={`${getRarityClassNames(
        rating
      )} w-10 rounded-lg py-1.5 text-center text-base font-medium tabular-nums sm:w-12 sm:py-2 sm:text-lg`}
    >
      {rating > 0 ? rating : 0}
    </div>
  );
}
