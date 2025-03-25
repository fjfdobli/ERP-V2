import { supabase } from '../supabaseClient';

export interface InventoryItem {
  id: number;
  item_name: string;
  sku: string;
  type: string;
  quantity: number;
  min_stock: number;
  created_at: string;
}

export type InsertInventoryItem = Omit<InventoryItem, 'id' | 'created_at'>;
export type UpdateInventoryItem = Partial<InsertInventoryItem>;

// Mock data for development
const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    item_name: 'A4 Paper',
    sku: 'PPR-A4-001',
    type: 'Paper',
    quantity: 500,
    min_stock: 100,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    item_name: 'Black Ink',
    sku: 'INK-BLK-001',
    type: 'Ink',
    quantity: 5,
    min_stock: 10,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    item_name: 'Cyan Ink',
    sku: 'INK-CYN-001',
    type: 'Ink',
    quantity: 8,
    min_stock: 10,
    created_at: new Date().toISOString()
  }
];

export const inventoryService = {
  async getInventoryItems() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        return mockInventoryItems;
      }
      
      return data || mockInventoryItems;
    } catch (error) {
      console.error('Unexpected error in getInventoryItems:', error);
      return mockInventoryItems;
    }
  },
  
  async getInventoryItemById(id: number) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching inventory item with ID ${id}:`, error);
        const mockItem = mockInventoryItems.find(item => item.id === id);
        return mockItem || mockInventoryItems[0];
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getInventoryItemById:`, error);
      const mockItem = mockInventoryItems.find(item => item.id === id);
      return mockItem || mockInventoryItems[0];
    }
  },
  
  async createInventoryItem(item: InsertInventoryItem) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select();
      
      if (error) {
        console.error('Error creating inventory item:', error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in createInventoryItem:', error);
      throw error;
    }
  },
  
  async updateInventoryItem(id: number, updates: UpdateInventoryItem) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating inventory item with ID ${id}:`, error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in updateInventoryItem:', error);
      throw error;
    }
  },
  
  async getLowStockItems() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .lt('quantity', 'min_stock');
      
      if (error) {
        console.error('Error fetching low stock items:', error);
        // Filter mock items to those with quantity below min_stock
        return mockInventoryItems.filter(item => item.quantity < item.min_stock);
      }
      
      return data || mockInventoryItems.filter(item => item.quantity < item.min_stock);
    } catch (error) {
      console.error('Unexpected error in getLowStockItems:', error);
      return mockInventoryItems.filter(item => item.quantity < item.min_stock);
    }
  },
  
  async restockItem(id: number, quantity: number) {
    try {
      // First get the current quantity
      const { data: item, error: getError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error(`Error fetching inventory item with ID ${id}:`, getError);
        throw getError;
      }
      
      const newQuantity = (item.quantity || 0) + quantity;
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error restocking inventory item with ID ${id}:`, error);
        throw error;
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in restockItem:', error);
      throw error;
    }
  },
  
  async searchInventory(query: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`item_name.ilike.%${query}%,sku.ilike.%${query}%,type.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error searching inventory:', error);
        // Filter mock items
        return mockInventoryItems.filter(item => 
          item.item_name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      return data || mockInventoryItems.filter(item => 
        item.item_name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Unexpected error in searchInventory:', error);
      return mockInventoryItems;
    }
  }
};