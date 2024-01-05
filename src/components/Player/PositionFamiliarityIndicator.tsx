import { positionalFamiliarity } from "@/config";

export function PositionFamiliarityIndicator({ positions, player }) {
  if (positions.includes(player.metadata.positions[0])) {
    return (
      <span className="inline-flex bg-indigo-600 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1">
        P
      </span>
    );
  }
  if (
    positions.includes(player.metadata.positions[1]) ||
    positions.includes(player.metadata.positions[2])
  ) {
    return (
      <span className="inline-flex bg-slate-300 items-center justify-center leading-none rounded text-slate-900 text-[10px] px-2 py-1">
        S
      </span>
    );
  }
  return null;
}

export function PositionalFamiliarityIndicator({ position, player }) {
  const familiarity = positionalFamiliarity.find(
    (pos) => pos.primaryPosition === player.metadata.positions[0]
  );
  if (player.metadata.positions.slice(1).includes(position)) {
    return (
      <span
        title="Secondary"
        className="inline-flex bg-lime-700 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1"
      >
        S
      </span>
    );
  }
  if (familiarity.adjustment[position] === -20) {
    return (
      <span
        title="Unfamiliar"
        className="inline-flex bg-red-700 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1"
      >
        U
      </span>
    );
  }
  if (familiarity.adjustment[position] === -8) {
    return (
      <span
        title="Somewhat Familiar"
        className="inline-flex bg-amber-600 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1"
      >
        SF
      </span>
    );
  }
  if (familiarity.adjustment[position] === -5) {
    return (
      <span
        title="Fairly Familiar"
        className="inline-flex bg-yellow-500 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1"
      >
        FF
      </span>
    );
  }
  if (familiarity.adjustment[position] === 0) {
    return (
      <span
        title="Primary"
        className="inline-flex bg-green-700 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1"
      >
        P
      </span>
    );
  }
  return null;
}
