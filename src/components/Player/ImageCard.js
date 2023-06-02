import Image from "next/image";
import Link from "next/link";

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
        <Link href={`https://app.playmfl.com/players/${playerId}`} target="_blank" className="mt-4 flex items-center justify-center space-x-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-950/50 px-3 py-2 rounded-lg cursor-pointer">
          <span>View Player</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>
    </div>
  )
}
