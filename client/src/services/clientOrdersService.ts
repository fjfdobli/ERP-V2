import { supabase } from '../supabaseClient';

export interface ClientOrder {
  id: number;
  order_id: string;
  client_id: number;
  date: string;
  amount: number;
  status: string;
  created_at: string;
  clients?: any; 
}

export type InsertClientOrder = Omit<ClientOrder, 'id' | 'created_at' | 'clients'>;
export type UpdateClientOrder = Partial<InsertClientOrder>;

// Mock data for development
const mockClientOrders: ClientOrder[] = [
  {
    id: 1,
    order_id: 'ORD-2025-00001',
    client_id: 1,
    date: new Date().toISOString().split('T')[0],
    amount: 1500,
    status: 'Pending',
    created_at: new Date().toISOString(),
    clients: { name: 'Acme Corporation', contactPerson: 'John Doe' }
  },
  {
    id: 2,
    order_id: 'ORD-2025-00002',
    client_id: 2,
    date: new Date().toISOString().split('T')[0],
    amount: 2200,
    status: 'In Progress',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    clients: { name: 'Globex Industries', contactPerson: 'Jane Smith' }
  }
];

export const clientOrdersService = {
  async getClientOrders() {
    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching client orders:', error);
        return mockClientOrders;
      }
      
      return data || mockClientOrders;
    } catch (error) {
      console.error('Unexpected error in getClientOrders:', error);
      return mockClientOrders;
    }
  },
  
  async getClientOrderById(id: number) {
    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching client order with ID ${id}:`, error);
        const mockOrder = mockClientOrders.find(order => order.id === id);
        return mockOrder || mockClientOrders[0];
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getClientOrderById:`, error);
      const mockOrder = mockClientOrders.find(order => order.id === id);
      return mockOrder || mockClientOrders[0];
    }
  },
  
  async createClientOrder(clientOrder: InsertClientOrder) {
    try {
      const { data, error } = await supabase
        .from('client_orders')
        .insert([clientOrder])
        .select();
      
      if (error) {
        console.error('Error creating client order:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in createClientOrder:', error);
      throw error;
    }
  },
  
  async updateClientOrder(id: number, updates: UpdateClientOrder) {
    try {
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
    } catch (error) {
      console.error('Unexpected error in updateClientOrder:', error);
      throw error;
    }
  },
  
  async changeOrderStatus(id: number, status: string) {
    try {
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
    } catch (error) {
      console.error('Unexpected error in changeOrderStatus:', error);
      throw error;
    }
  },
  
  async generateOrderId() {
    try {
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
        // Generate mock order ID
        return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
      }
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastOrderId = data[0].order_id;
        const lastNumber = parseInt(lastOrderId.substring(prefix.length));
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Unexpected error in generateOrderId:', error);
      // Generate mock order ID
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;
      return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
    }
  }
};