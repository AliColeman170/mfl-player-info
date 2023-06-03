import Image from "next/image";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'

export default function ImageCard({ playerId }) {
  return (
    <div className="mx-auto max-w-xs sm:mx-0">
        <Image
            className="-mt-2"
            src={`https://d13e14gtps4iwl.cloudfront.net/players/${playerId}/card_512.png`}
            alt=""
            width="512"
            height="748"
            priority
        />
        <Link href={`https://app.playmfl.com/players/${playerId}`} target="_blank" className="mt-4 flex items-center justify-center space-x-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-950/50 px-3 py-2 rounded-lg cursor-pointer">
          <span>View Player</span>
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
        </Link>
    </div>
  )
}
