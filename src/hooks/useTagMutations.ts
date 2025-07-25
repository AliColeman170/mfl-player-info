import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateTagsParams {
  player_id: number;
  tags: string[];
}

interface UpdateTagsResponse {
  success: boolean;
  message: string;
  player_id: number;
  tags: string[];
}

async function updateTags({ player_id, tags }: UpdateTagsParams): Promise<UpdateTagsResponse> {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ player_id, tags }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tags');
  }

  return response.json();
}

export function useUpdateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTags,
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['players-db-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tags');
    },
  });
}

// Helper hooks for common operations
export function useAddTag() {
  const updateTagsMutation = useUpdateTags();

  return useMutation({
    mutationFn: ({ player_id, currentTags, newTag }: { 
      player_id: number; 
      currentTags: string[]; 
      newTag: string;
    }) => {
      const updatedTags = [...currentTags, newTag];
      return updateTagsMutation.mutateAsync({ player_id, tags: updatedTags });
    },
    onSuccess: () => {
      toast.success('Tag added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add tag');
    },
  });
}

export function useRemoveTag() {
  const updateTagsMutation = useUpdateTags();

  return useMutation({
    mutationFn: ({ player_id, currentTags, tagIndex }: { 
      player_id: number; 
      currentTags: string[]; 
      tagIndex: number;
    }) => {
      const updatedTags = [...currentTags];
      updatedTags.splice(tagIndex, 1);
      return updateTagsMutation.mutateAsync({ player_id, tags: updatedTags });
    },
    onSuccess: () => {
      toast.success('Tag removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove tag');
    },
  });
}