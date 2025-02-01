import { getRarityClassNames } from '@/utils/helpers';

export function StyledRatingValue({ rating }: { rating: number }) {
  return (
    <span
      className={`${getRarityClassNames(
        rating
      )} w-10 rounded-lg p-2 text-center text-base font-medium sm:w-12 sm:p-3 sm:text-lg`}
    >
      {rating > 0 ? rating : 0}
    </span>
  );
}
