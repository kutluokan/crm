export interface Customer {
  id: string
  created_at: string
  name: string
  email: string
  phone?: string
  company?: string
}

export interface Ticket {
  id: string
  created_at: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer_id: string
  assigned_to?: string
}

export interface Employee {
  id: string
  created_at: string
  email: string
  full_name: string
  avatar_url?: string
  department?: string
  role: 'support' | 'admin' | 'manager'
}

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at'>
        Update: Partial<Omit<Ticket, 'id' | 'created_at'>>
      }
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at'>
        Update: Partial<Omit<Employee, 'id' | 'created_at'>>
      }
    }
  }
} 