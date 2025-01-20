import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type Ticket = {
  id: string;
  created_at: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: {
    name: string;
    email: string;
  };
  assigned_to: {
    full_name: string;
  } | null;
};

type TicketQueryParams = {
  page: number;
  rowsPerPage: number;
  statusFilter: string;
  priorityFilter: string;
  searchQuery: string;
};

const fetchTickets = async ({
  page,
  rowsPerPage,
  statusFilter,
  priorityFilter,
  searchQuery,
}: TicketQueryParams) => {
  // First, get the total count
  let countQuery = supabase
    .from('tickets')
    .select('id', { count: 'exact' });

  // Apply filters to count query
  if (statusFilter !== 'all') {
    countQuery = countQuery.eq('status', statusFilter);
  }
  if (priorityFilter !== 'all') {
    countQuery = countQuery.eq('priority', priorityFilter);
  }
  if (searchQuery) {
    countQuery = countQuery.ilike('title', `%${searchQuery}%`);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    throw new Error(`Error getting count: ${countError.message}`);
  }

  // Then fetch the paginated data
  let query = supabase
    .from('tickets')
    .select(`
      id,
      created_at,
      title,
      status,
      priority,
      customer:customers!customer_id (
        name,
        email
      ),
      assigned_to:users!assigned_to (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .range(page * rowsPerPage, (page * rowsPerPage) + rowsPerPage - 1);

  // Apply filters
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (priorityFilter !== 'all') {
    query = query.eq('priority', priorityFilter);
  }
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching tickets: ${error.message}`);
  }

  return {
    tickets: data as Ticket[],
    totalCount: count || 0,
  };
};

export function useTickets(params: TicketQueryParams) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => fetchTickets(params),
    keepPreviousData: true, // Keep previous data while fetching new data
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          created_at,
          title,
          description,
          status,
          priority,
          customer:customers!customer_id (
            id,
            name,
            email,
            phone,
            company_name
          ),
          assigned_to:users!assigned_to (
            id,
            full_name
          ),
          created_by:users!created_by (
            full_name
          ),
          resolved_at,
          resolution_notes
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Error fetching ticket: ${error.message}`);
      }

      return data;
    },
  });
} 