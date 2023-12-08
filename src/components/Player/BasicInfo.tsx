import { Suspense } from "react";
import SpinnerIcon from "../SpinnerIcon";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { MarketValue } from "./MarketValue";

export default async function BasicInfo({ player }) {
  const {
    name,
    firstName,
    lastName,
    ageAtMint,
    height,
    preferredFoot,
    positions,
  } = player.metadata;
  const metadata = {
    name: name ? name : `${firstName} ${lastName}`,
    age: ageAtMint,
    height: `${height}cm`,
    foot: preferredFoot.toLowerCase(),
    position: positions.join(" / "),
  };
  return (
    <div className="col-span-2">
      <dl className="@container/inner divide-y divide-slate-200 dark:divide-slate-700">
        {Object.entries(metadata).map(([key, value]) => (
          <div
            key={key}
            className="px-1 py-1.5 @[16rem]/inner:py-2 grid grid-cols-3 gap-8 @[16rem]/inner:px-0"
          >
            <dt className="text-sm @[16rem]/inner:text-base font-semibold leading-6 text-slate-700 dark:text-slate-400 uppercase">
              {key}
            </dt>
            <dd className="text-sm @[16rem]/inner:text-base leading-6 text-slate-700 dark:text-slate-200 text-right @[16rem]/inner:text-left col-span-2 capitalize">
              {value}
            </dd>
          </div>
        ))}
        <div className="px-1 py-1.5 @[16rem]/inner:py-2 grid grid-cols-3 gap-8 @[16rem]/inner:px-0">
          <dt className="text-sm @[16rem]/inner:text-base font-semibold leading-6 text-slate-700 dark:text-slate-400 uppercase flex items-center space-x-2">
            <span>Value</span>
            <div className="group relative flex justify-center">
              <button>
                <InformationCircleIcon className="h-5 w-5 text-slate-500" />
              </button>
              <span className="absolute w-48 normal-case text-center bottom-8 scale-0 transition-all rounded-lg bg-slate-950 shadow shadow-white/10 p-2 text-xs text-white group-hover:scale-100">
                Based on average of last 3 sales for similar age, rating and
                position.
              </span>
            </div>
          </dt>
          <dd className="text-sm @[16rem]/inner:text-base leading-6 text-slate-700 dark:text-slate-200 text-right @[16rem]/inner:text-left col-span-2 capitalize flex items-center justify-end @[16rem]/inner:justify-start">
            <Suspense
              fallback={
                <SpinnerIcon className="animate-spin h-4 w-4 text-slate-400" />
              }
            >
              <MarketValue player={player} />
            </Suspense>
          </dd>
        </div>
      </dl>
    </div>
  );
}
