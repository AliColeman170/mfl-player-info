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
