import { cn } from '@/utils/helpers';
import { AddTagButton } from './AddTagButton';
import { RemoveTagButton } from './RemoveTagButton';

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className='group relative cursor-default rounded-lg bg-slate-100 px-3 py-1 text-xs ring-1 ring-slate-950 ring-opacity-5 dark:bg-slate-800 dark:ring-slate-800'>
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
        `mt-1 flex items-center gap-1`,
        wrap &&
          'flex-wrap break-all @[16rem]/inner:mt-0 @[16rem]/inner:justify-end'
      )}
    >
      {children}
    </div>
  );
}

export function TagsList({
  playerId,
  tags,
  isFavourite,
  wrap,
}: {
  playerId: number;
  tags: string[];
  isFavourite: boolean;
  wrap?: boolean;
}) {
  if (!isFavourite)
    return (
      <span className='text-xs text-slate-500'>Favourite to add tags</span>
    );

  return (
    <TagsListWrapper wrap={wrap}>
      {tags.map((tag, index) => (
        <Tag key={`${playerId}-${tag}`}>
          {tag}
          <RemoveTagButton tags={tags} playerId={playerId} tagIndex={index} />
        </Tag>
      ))}
      <AddTagButton playerId={playerId} tags={tags} />
    </TagsListWrapper>
  );
}
