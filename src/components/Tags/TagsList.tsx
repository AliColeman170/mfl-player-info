import { AddTagButton } from "./AddTagButton";
import RemoveTagButton from "./RemoveTagButton";

export function TagsList({ user, player }) {
  if (!user?.addr)
    return <span className="text-xs text-slate-500">Log in to add tags</span>;

  if (!player.is_favourite)
    return (
      <span className="text-xs text-slate-500">Favourite to add tags</span>
    );

  return (
    <div className="flex items-center space-x-1">
      {player.tags?.map((tag, index) => (
        <div
          key={`${player.id}-${tag}`}
          className="group cursor-default relative bg-slate-100 dark:bg-slate-800 text-xs px-3 py-1 rounded-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
        >
          {tag}
          <RemoveTagButton player={player} tagIndex={index} />
        </div>
      ))}
      <AddTagButton player={player} />
    </div>
  );
}
