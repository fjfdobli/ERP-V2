// client/src/services/supplierOrdersService.ts
import { supabase } from '../supabaseClient';

export interface SupplierOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  suppliers?: any; // For joined supplier data
}

export type InsertSupplierOrder = Omit<SupplierOrder, 'id' | 'created_at' | 'suppliers'>;
export type UpdateSupplierOrder = Partial<InsertSupplierOrder>;

export const supplierOrdersService = {
  // Get all supplier orders
  async getSupplierOrders() {
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*, suppliers(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching supplier orders:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get supplier order by ID
  async getSupplierOrderById(id: number) {
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*, suppliers(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching supplier order with ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Create new supplier order
  async createSupplierOrder(supplierOrder: InsertSupplierOrder) {
    const { data, error } = await supabase
      .from('supplier_orders')
      .insert([supplierOrder])
      .select();
    
    if (error) {
      console.error('Error creating supplier order:', error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Update supplier order
  async updateSupplierOrder(id: number, updates: UpdateSupplierOrder) {
    const { data, error } = await supabase
      .from('supplier_orders')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error updating supplier order with ID ${id}:`, error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Change order status
  async changeOrderStatus(id: number, status: string) {
    const { data, error } = await supabase
      .from('supplier_orders')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error changing status for supplier order with ID ${id}:`, error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Generate a new PO number
  async generatePoNumber() {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('po_number')
      .like('po_number', `${prefix}%`)
      .order('po_number', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error generating PO number:', error);
      throw error;
    }
    
    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastPoNumber = data[0].po_number;
      const lastNumber = parseInt(lastPoNumber.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }
};