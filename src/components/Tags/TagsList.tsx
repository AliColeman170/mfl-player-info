import { cn } from "@/utils/helpers";
import { AddTagButton } from "./AddTagButton";
import RemoveTagButton from "./RemoveTagButton";

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="group cursor-default relative bg-slate-100 dark:bg-slate-800 text-xs px-3 py-1 rounded-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5">
      {children}
    </div>
  );
}
export function TagsListWrapper({
  wrap = false,
  children,
}: {
  wrap?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        `flex items-center gap-1 mt-1`,
        wrap &&
          "flex-wrap @[16rem]/inner:justify-end @[16rem]/inner:mt-0 break-all"
      )}
    >
      {children}
    </div>
  );
}

export function TagsList({
  wrap,
  user,
  player,
}: {
  wrap?: boolean;
  user;
  player;
}) {
  if (!user?.addr)
    return <span className="text-xs text-slate-500">Log in to add tags</span>;

  if (!player.is_favourite)
    return (
      <span className="text-xs text-slate-500">Favourite to add tags</span>
    );

  return (
    <TagsListWrapper wrap={wrap}>
      {player.tags?.map((tag, index) => (
        <Tag key={`${player.id}-${tag}`}>
          {tag}
          <RemoveTagButton player={player} tagIndex={index} />
        </Tag>
      ))}
      <AddTagButton player={player} />
    </TagsListWrapper>
  );
}
