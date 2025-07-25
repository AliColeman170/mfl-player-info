import { cn } from '@/utils/helpers';
import { AddTagButton } from './AddTagButton';
import { RemoveTagButton } from './RemoveTagButton';
import { Badge } from '@/components/UI/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/UI/tooltip';

export function Tag({
  children,
  playerId,
  tags,
  tagIndex,
}: {
  children: React.ReactNode;
  playerId?: number;
  tags?: string[];
  tagIndex?: number;
}) {
  return (
    <Badge
      variant='outline'
      className='group bg-background relative cursor-default overflow-visible text-[11px]'
    >
      {children}
      {playerId && tags && tagIndex !== undefined && (
        <RemoveTagButton tags={tags} playerId={playerId} tagIndex={tagIndex} />
      )}
    </Badge>
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
  wrap,
}: {
  playerId: number;
  tags: string[];
  wrap?: boolean;
}) {
  const maxVisibleTags = 3;
  const shouldTruncate = tags.length > maxVisibleTags;
  const visibleTags = shouldTruncate ? tags.slice(0, 2) : tags;
  const hiddenTags = shouldTruncate ? tags.slice(2) : [];
  const hiddenCount = hiddenTags.length;

  return (
    <TagsListWrapper wrap={wrap}>
      {visibleTags.map((tag, index) => (
        <Tag
          key={`${playerId}-${tag}`}
          playerId={playerId}
          tags={tags}
          tagIndex={index}
        >
          {tag}
        </Tag>
      ))}

      {shouldTruncate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant='outline'
              className='bg-background cursor-help text-[11px]'
            >
              +{hiddenCount} More
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            className='bg-popover [&_>_span_>_svg]:bg-popover [&_>_span_>_svg]:fill-popover text-popover-foreground max-w-xs border p-0 [&_>_span_>_svg]:border'
          >
            <div className='bg-background relative z-1 flex flex-col gap-2 rounded-md p-2'>
              <div className='text-[11px]'>Additional Tags:</div>
              <div className='flex flex-wrap gap-1'>
                {hiddenTags.map((tag, index) => (
                  <Tag
                    key={`${playerId}-tooltip-${tag}`}
                    playerId={playerId}
                    tags={tags}
                    tagIndex={index + 2} // +2 because these are the tags after the first 2 visible ones
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      <AddTagButton playerId={playerId} tags={tags} />
    </TagsListWrapper>
  );
}
