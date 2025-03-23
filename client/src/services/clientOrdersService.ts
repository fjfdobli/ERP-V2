// client/src/services/clientOrdersService.ts
import { supabase } from '../supabaseClient';

export interface ClientOrder {
  id: number;
  order_id: string;
  client_id: number;
  date: string;
  amount: number;
  status: string;
  created_at: string;
  clients?: any; // For joined client data
}

export type InsertClientOrder = Omit<ClientOrder, 'id' | 'created_at' | 'clients'>;
export type UpdateClientOrder = Partial<InsertClientOrder>;

export const clientOrdersService = {
  // Get all client orders
  async getClientOrders() {
    const { data, error } = await supabase
      .from('client_orders')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching client orders:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get client order by ID
  async getClientOrderById(id: number) {
    const { data, error } = await supabase
      .from('client_orders')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching client order with ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Create new client order
  async createClientOrder(clientOrder: InsertClientOrder) {
    const { data, error } = await supabase
      .from('client_orders')
      .insert([clientOrder])
      .select();
    
    if (error) {
      console.error('Error creating client order:', error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Update client order
  async updateClientOrder(id: number, updates: UpdateClientOrder) {
    const { data, error } = await supabase
      .from('client_orders')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error updating client order with ID ${id}:`, error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Change order status
  async changeOrderStatus(id: number, status: string) {
    const { data, error } = await supabase
      .from('client_orders')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error changing status for client order with ID ${id}:`, error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Generate a new order ID
  async generateOrderId() {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    
    const { data, error } = await supabase
      .from('client_orders')
      .select('order_id')
      .like('order_id', `${prefix}%`)
      .order('order_id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error generating order ID:', error);
      throw error;
    }
    
    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastOrderId = data[0].order_id;
      const lastNumber = parseInt(lastOrderId.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }
};