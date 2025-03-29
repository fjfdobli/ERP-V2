import { supabase } from '../supabaseClient';

export interface OrderRequest {
  id: number;
  request_id: string;
  client_id: number;
  date: string;
  type: string;
  status: string;
  created_at: string;
  clients?: any; 
}

export type InsertOrderRequest = Omit<OrderRequest, 'id' | 'created_at' | 'clients'>;
export type UpdateOrderRequest = Partial<InsertOrderRequest>;

const mockOrderRequests: OrderRequest[] = [
  {
    id: 1,
    request_id: 'REQ-2025-00001',
    client_id: 1,
    date: new Date().toISOString().split('T')[0],
    type: 'Business Cards',
    status: 'Pending',
    created_at: new Date().toISOString(),
    clients: { name: 'Acme Corporation', contactPerson: 'John Doe' }
  },
  {
    id: 2,
    request_id: 'REQ-2025-00002',
    client_id: 2,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    type: 'Brochures',
    status: 'Approved',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    clients: { name: 'Globex Industries', contactPerson: 'Jane Smith' }
  }
];

export const orderRequestsService = {
  async getOrderRequests() {
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching order requests:', error);
        return mockOrderRequests;
      }
      
      return data || mockOrderRequests;
    } catch (error) {
      console.error('Unexpected error in getOrderRequests:', error);
      return mockOrderRequests;
    }
  },
  
  async getOrderRequestById(id: number) {
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching order request with ID ${id}:`, error);
        const mockRequest = mockOrderRequests.find(req => req.id === id);
        return mockRequest || mockOrderRequests[0];
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getOrderRequestById:`, error);
      const mockRequest = mockOrderRequests.find(req => req.id === id);
      return mockRequest || mockOrderRequests[0];
    }
  },
  
  async createOrderRequest(orderRequest: InsertOrderRequest) {
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .insert([orderRequest])
        .select();
      
      if (error) {
        console.error('Error creating order request:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in createOrderRequest:', error);
      throw error;
    }
  },
  
  async updateOrderRequest(id: number, updates: UpdateOrderRequest) {
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating order request with ID ${id}:`, error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in updateOrderRequest:', error);
      throw error;
    }
  },
  
  async changeRequestStatus(id: number, status: string) {
    try {
      const { data, error } = await supabase
        .from('order_requests')
        .update({ status })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error changing status for order request with ID ${id}:`, error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in changeRequestStatus:', error);
      throw error;
    }
  },
  
  async generateRequestId() {
    try {
      const year = new Date().getFullYear();
      const prefix = `REQ-${year}-`;
      
      const { data, error } = await supabase
        .from('order_requests')
        .select('request_id')
        .like('request_id', `${prefix}%`)
        .order('request_id', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error generating request ID:', error);
        return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
      }
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastRequestId = data[0].request_id;
        const lastNumber = parseInt(lastRequestId.substring(prefix.length));
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Unexpected error in generateRequestId:', error);
      const year = new Date().getFullYear();
      const prefix = `REQ-${year}-`;
      return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
    }
  }
};