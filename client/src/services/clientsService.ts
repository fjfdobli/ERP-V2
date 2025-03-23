import { supabase } from '../supabaseClient';

export interface Client {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export type InsertClient = Omit<Client, 'id' | 'created_at'>;
export type UpdateClient = Partial<InsertClient>;

export const clientsService = {
  // Get all clients
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get client by ID
  async getClientById(id: number) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching client with ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Create new client
  async createClient(client: InsertClient) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Update client
  async updateClient(id: number, updates: UpdateClient) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error updating client with ID ${id}:`, error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Search clients
  async searchClients(query: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,contact_person.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
    
    return data || [];
  }
};