// client/src/services/orderRequestsService.ts
import { supabase } from '../supabaseClient';

export interface OrderRequest {
  id: number;
  request_id: string;
  client_id: number;
  date: string;
  type: string;
  status: string;
  created_at: string;
  clients?: any; // For joined client data
}

export type InsertOrderRequest = Omit<OrderRequest, 'id' | 'created_at' | 'clients'>;
export type UpdateOrderRequest = Partial<InsertOrderRequest>;

export const orderRequestsService = {
  // Get all order requests
  async getOrderRequests() {
    const { data, error } = await supabase
      .from('order_requests')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching order requests:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get order request by ID
  async getOrderRequestById(id: number) {
    const { data, error } = await supabase
      .from('order_requests')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching order request with ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Create new order request
  async createOrderRequest(orderRequest: InsertOrderRequest) {
    const { data, error } = await supabase
      .from('order_requests')
      .insert([orderRequest])
      .select();
    
    if (error) {
      console.error('Error creating order request:', error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Update order request
  async updateOrderRequest(id: number, updates: UpdateOrderRequest) {
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
  },
  
  // Change order request status
  async changeRequestStatus(id: number, status: string) {
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
  },
  
  // Generate a new request ID
  async generateRequestId() {
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
      throw error;
    }
    
    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastRequestId = data[0].request_id;
      const lastNumber = parseInt(lastRequestId.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }
};