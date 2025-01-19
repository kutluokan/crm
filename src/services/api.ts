import { supabase } from '../lib/supabase'
import type { Customer, Ticket } from '../types/database'

// Customer API
export const customerAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, customer: Partial<Omit<Customer, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Ticket API
export const ticketAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customers (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(ticket: Omit<Ticket, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, ticket: Partial<Omit<Ticket, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('tickets')
      .update(ticket)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
} 