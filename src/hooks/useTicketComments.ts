import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type TicketComment = {
  id: string;
  created_at: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  user: {
    full_name: string;
  };
};

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['ticketComments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          id,
          created_at,
          ticket_id,
          user_id,
          comment,
          is_internal,
          user:users!user_id (
            full_name
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Error fetching ticket comments: ${error.message}`);
      }

      // Ensure the data matches our TicketComment type
      const typedData = data?.map(item => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user
      })) as TicketComment[];

      return typedData;
    },
  });
}

type AddCommentParams = {
  ticketId: string;
  comment: string;
  isInternal: boolean;
  userId: string;
};

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, comment, isInternal, userId }: AddCommentParams) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          comment,
          is_internal: isInternal,
        })
        .select(`
          id,
          created_at,
          ticket_id,
          user_id,
          comment,
          is_internal,
          user:users!user_id (
            full_name
          )
        `)
        .single();

      if (error) {
        throw new Error(`Error adding comment: ${error.message}`);
      }

      return data as TicketComment;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries(['ticketComments', ticketId]);
    },
  });
}

type EditCommentParams = {
  id: string;
  ticketId: string;
  comment: string;
  isInternal: boolean;
};

export function useEditComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment, isInternal }: EditCommentParams) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .update({
          comment,
          is_internal: isInternal,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error editing comment: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries(['ticketComments', ticketId]);
    },
  });
}

type DeleteCommentParams = {
  id: string;
  ticketId: string;
};

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ticketId }: DeleteCommentParams) => {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .match({ id });

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Error deleting comment: ${error.message}`);
      }

      return id;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries(['ticketComments', ticketId]);
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
    },
  });
} 