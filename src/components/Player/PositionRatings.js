import { attributeWeighting } from '@/config';
import { getRarityClassNames } from '@/utils'

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
    return <span className={`inline-flex justify-center w-7 ml-2 font-medium ${colorClass}`}>{text}</span>;
}

export default function PositionRatings({ player }) {
    const positionRatings = attributeWeighting.map(({ positions, weighting }) => {
        const { passing, shooting, defense, dribbling, pace, physical } = player.metadata;
        const rating = Math.round(
            passing * weighting[0] +
            shooting * weighting[1] +
            defense * weighting[2] +
            dribbling * weighting[3] +
            pace * weighting[4] +
            physical * weighting[5]
        );
        return {
            positions,
            rating,
            difference: rating - player.metadata.overall
        };
    }).sort((a, b) => b.rating - a.rating);

    return (
        <div className="mt-12">
            <h2 className="text-slate-900 dark:text-slate-200 font-bold tracking-tight text-3xl">Position Ratings</h2>
            <div className="mt-4 flow-root">
                <div className="-my-2 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {positionRatings.map(({positions, rating, difference}) => (
                                    <tr key={positions}>
                                        <td className="w-full whitespace-nowrap px-2 py-5 text-left font-medium text-slate-700 dark:text-slate-200 sm:pl-1">
                                            <div className='flex items-center space-x-2'>
                                                <span>{positions.join(' / ')}</span>
                                                {positions.includes(player.metadata.positions[0]) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500">
                                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 text-center font-medium text-gray-500 dark:text-slate-200">
                                            <span className={`${getRarityClassNames(rating)} rounded-lg inline-flex justify-center w-12 p-3 font-medium`}>{(rating > 0) ? rating : '–'}</span>
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
    )
}
