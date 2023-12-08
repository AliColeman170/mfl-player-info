import { getRarityClassNames } from "@/utils/helpers";

export function StyledRatingValue({ rating }) {
  return (
    <span
      className={`${getRarityClassNames(
        rating
      )} rounded-lg text-base sm:text-lg w-10 sm:w-12 p-2 sm:p-3 font-medium text-center`}
    >
      {rating > 0 ? rating : 0}
    </span>
  );
}
