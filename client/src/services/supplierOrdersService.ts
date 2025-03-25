import { supabase } from '../supabaseClient';

export interface SupplierOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  suppliers?: any;
}

export type InsertSupplierOrder = Omit<SupplierOrder, 'id' | 'created_at' | 'suppliers'>;
export type UpdateSupplierOrder = Partial<InsertSupplierOrder>;

// Mock data for development
const mockSupplierOrders: SupplierOrder[] = [
  {
    id: 1,
    po_number: 'PO-2025-00001',
    supplier_id: 1,
    order_date: new Date().toISOString().split('T')[0],
    total_amount: 2500,
    status: 'Pending',
    created_at: new Date().toISOString(),
    suppliers: { name: 'Paper Suppliers Inc.', contact_person: 'Mike Johnson' }
  },
  {
    id: 2,
    po_number: 'PO-2025-00002',
    supplier_id: 2,
    order_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
    total_amount: 1800,
    status: 'Delivered',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    suppliers: { name: 'Ink Masters Ltd.', contact_person: 'Sarah Williams' }
  }
];

export const supplierOrdersService = {
  async getSupplierOrders() {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*, suppliers(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching supplier orders:', error);
        return mockSupplierOrders;
      }
      
      return data || mockSupplierOrders;
    } catch (error) {
      console.error('Unexpected error in getSupplierOrders:', error);
      return mockSupplierOrders;
    }
  },
  
  async getSupplierOrderById(id: number) {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*, suppliers(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching supplier order with ID ${id}:`, error);
        const mockOrder = mockSupplierOrders.find(order => order.id === id);
        return mockOrder || mockSupplierOrders[0];
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getSupplierOrderById:`, error);
      const mockOrder = mockSupplierOrders.find(order => order.id === id);
      return mockOrder || mockSupplierOrders[0];
    }
  },
  
  async createSupplierOrder(supplierOrder: InsertSupplierOrder) {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .insert([supplierOrder])
        .select();
      
      if (error) {
        console.error('Error creating supplier order:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in createSupplierOrder:', error);
      throw error;
    }
  },
  
  async updateSupplierOrder(id: number, updates: UpdateSupplierOrder) {
    try {
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
    } catch (error) {
      console.error('Unexpected error in updateSupplierOrder:', error);
      throw error;
    }
  },
  
  async changeOrderStatus(id: number, status: string) {
    try {
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
    } catch (error) {
      console.error('Unexpected error in changeOrderStatus:', error);
      throw error;
    }
  },
  
  // Generate a new PO number
  async generatePoNumber() {
    try {
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
        // Generate mock PO number
        return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
      }
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastPoNumber = data[0].po_number;
        const lastNumber = parseInt(lastPoNumber.substring(prefix.length));
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Unexpected error in generatePoNumber:', error);
      // Generate mock PO number
      const year = new Date().getFullYear();
      const prefix = `PO-${year}-`;
      return `${prefix}${(Math.floor(Math.random() * 10000) + 1).toString().padStart(5, '0')}`;
    }
  }
};