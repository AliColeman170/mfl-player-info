'use client';

import { useState, use } from 'react';
import { Player } from '@/types/global.types';
import { useUser } from '../Wallet/UserProvider';
import { Badge } from '../UI/badge';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { X, Plus, Tag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../UI/popover';
import { SpinnerIcon } from '../SpinnerIcon';
import { useUpdateTags } from '@/hooks/useTagMutations';

interface TagManagerProps {
  player: Player;
  currentTags?: string[];
  className?: string;
}

export function TagManager({
  player,
  currentTags = [],
  className,
}: TagManagerProps) {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(currentTags);
  const updateTagsMutation = useUpdateTags();

  const isAuthenticated = !!user?.app_metadata?.address;

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!isAuthenticated) return;

    updateTagsMutation.mutate(
      { player_id: player.id, tags },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setTags(currentTags);
    setNewTag('');
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className={`gap-2 ${className}`}>
          <Tag className='h-4 w-4' />
          {currentTags.length > 0 ? (
            <span>
              {currentTags.length} tag{currentTags.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span>Add tags</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-80 p-4' align='start'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium'>Manage Tags</h4>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleCancel}
                disabled={updateTagsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size='sm'
                onClick={handleSave}
                disabled={updateTagsMutation.isPending}
              >
                {updateTagsMutation.isPending ? (
                  <SpinnerIcon className='h-4 w-4 animate-spin' />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          {/* Current Tags */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Current Tags</label>
            {tags.length > 0 ? (
              <div className='flex flex-wrap gap-1'>
                {tags.map((tag) => (
                  <Badge key={tag} variant='secondary' className='gap-1'>
                    {tag}
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-auto p-0 hover:bg-transparent'
                      onClick={() => handleRemoveTag(tag)}
                      disabled={updateTagsMutation.isPending}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>No tags yet</p>
            )}
          </div>

          {/* Add New Tag */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Add New Tag</label>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter tag name...'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className='flex-1'
                disabled={updateTagsMutation.isPending}
              />
              <Button
                size='sm'
                onClick={handleAddTag}
                disabled={!newTag.trim() || updateTagsMutation.isPending}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <p className='text-muted-foreground text-xs'>
            Tags help you organize and find players more easily. They&apos;re
            private to your account.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
