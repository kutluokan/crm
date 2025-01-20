import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Ticket {
  id: string;
  created_at: string;
  title: string;
  status: string;
  priority: string;
  customer: {
    name: string;
    email: string;
  };
  assigned_to: {
    full_name: string;
  } | null;
}

export interface TicketQueryParams {
  page: number;
  rowsPerPage: number;
  searchTerm?: string;
  status?: string;
  priority?: string;
}

export function useTickets(params: TicketQueryParams) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const { page, rowsPerPage, searchTerm, status, priority } = params;

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
          assigned_to:employees!assigned_to (
            full_name
          )
        `, { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data, error, count } = await query
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching tickets: ${error.message}`);
      }

      // Transform the data to match our Ticket type
      const typedData = data?.map(item => ({
        ...item,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
        assigned_to: Array.isArray(item.assigned_to) ? item.assigned_to[0] : item.assigned_to
      })) as Ticket[];

      return {
        tickets: typedData,
        totalCount: count || 0
      };
    }
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
          assigned_to:employees!assigned_to (
            id,
            full_name
          ),
          created_by:employees!created_by (
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