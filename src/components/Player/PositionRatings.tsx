import { getPlayerPositionRatings, getRarityClassNames } from "@/utils/helpers";
import { StarIcon } from "@heroicons/react/24/solid";

const DifferenceBadge = ({ difference }) => {
  let colorClass = "";
  let text = difference.toString();

  if (difference > 0) {
    colorClass = "text-green-600";
    text = `+${difference}`;
  } else if (difference < 0) {
    colorClass = "text-red-600";
  } else {
    colorClass = "text-slate-400 dark:text-slate-200";
  }
  return (
    <span
      className={`inline-flex justify-center w-7 ml-1.5 sm:ml-2 text-sm sm:text-base font-medium ${colorClass}`}
    >
      {text}
    </span>
  );
};

export default function PositionRatings({ player }) {
  const positionRatings = getPlayerPositionRatings(player);

  return (
    <div className="mt-12">
      <h2 className="text-slate-900 dark:text-slate-200 font-bold tracking-tight text-3xl">
        Position Ratings
      </h2>
      <div className="mt-4 flow-root">
        <div className="-my-2 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {positionRatings.map(({ positions, rating, difference }) => (
                  <tr key={positions.join("-")}>
                    <td className="w-full whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-left font-medium text-slate-700 dark:text-slate-200 sm:pl-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-base">
                          {positions.join(" / ")}
                        </span>
                        {positions.includes(player.metadata.positions[0]) && (
                          <StarIcon className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-center font-medium text-slate-500 dark:text-slate-200">
                      <span
                        className={`${getRarityClassNames(
                          rating
                        )} rounded-lg text-base sm:text-lg w-12 p-2.5 sm:p-3 font-medium`}
                      >
                        {rating > 0 ? rating : "–"}
                      </span>
                      <DifferenceBadge difference={difference} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
