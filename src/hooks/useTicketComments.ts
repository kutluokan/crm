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

      if (!data) return [];

      // Transform the data to match our TicketComment type
      const typedData = data.map(item => {
        const userInfo = Array.isArray(item.user) ? item.user[0] : item.user;
        return {
          id: item.id,
          created_at: item.created_at,
          ticket_id: item.ticket_id,
          user_id: item.user_id,
          comment: item.comment,
          is_internal: item.is_internal,
          user: {
            full_name: userInfo.full_name
          }
        } satisfies TicketComment;
      });

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

interface UserData {
  full_name: string;
}

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

      if (!data) {
        throw new Error('No data returned from insert');
      }

      const userData = Array.isArray(data.user) ? data.user[0] : data.user as UserData;

      // Transform the data to match our TicketComment type
      const transformedData = {
        id: data.id,
        created_at: data.created_at,
        ticket_id: data.ticket_id,
        user_id: data.user_id,
        comment: data.comment,
        is_internal: data.is_internal,
        user: {
          full_name: userData.full_name
        }
      } satisfies TicketComment;

      return transformedData;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', ticketId] });
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
    mutationFn: async ({ id, comment, isInternal, ticketId }: EditCommentParams) => {
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

      return { ...data, ticketId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', result.ticketId] });
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

      return { id, ticketId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', result.ticketId] });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
    },
  });
} 