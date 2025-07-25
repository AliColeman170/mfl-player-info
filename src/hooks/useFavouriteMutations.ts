import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface UpdateFavouriteParams {
  player_id: number;
  is_favourite: boolean;
}

interface UpdateFavouriteResponse {
  success: boolean;
  message: string;
  player_id: number;
  is_favourite: boolean;
}

async function updateFavourite({
  player_id,
  is_favourite,
}: UpdateFavouriteParams): Promise<UpdateFavouriteResponse> {
  console.log({ upsertData: { player_id, is_favourite } });

  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.app_metadata?.address) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('favourites')
    .upsert({
      wallet_address: user.app_metadata.address,
      player_id,
      is_favourite,
    })
    .select('player_id, is_favourite')
    .single();

  console.log({ upsertResult: { data, error } });

  if (error) {
    throw new Error(error.message || 'Failed to update favourite');
  }

  const action = is_favourite ? 'added to' : 'removed from';
  return {
    success: true,
    message: `Player ${action} favourites!`,
    player_id,
    is_favourite,
  };
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFavourite,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['player', variables.player_id] });

      // Snapshot the previous value
      const previousPlayer = queryClient.getQueryData(['player', variables.player_id]);

      // Optimistically update the player data
      queryClient.setQueryData(['player', variables.player_id], (old: any) => {
        if (old) {
          return {
            ...old,
            is_favourite: variables.is_favourite,
          };
        }
        return old;
      });

      // Return a context object with the snapshotted value
      return { previousPlayer, playerId: variables.player_id };
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPlayer) {
        queryClient.setQueryData(['player', context.playerId], context.previousPlayer);
      }
      toast.error(err.message || 'Failed to update favourite');
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['players-db-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] });
      queryClient.invalidateQueries({ queryKey: ['player', data.player_id] });
      toast.success(data.message);
    },
  });
}
