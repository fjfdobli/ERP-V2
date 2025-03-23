// client/src/services/inventoryService.ts
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

export const inventoryService = {
  // Get all inventory items
  async getInventoryItems() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Get inventory item by ID
  async getInventoryItemById(id: number) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching inventory item with ID ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  // Create new inventory item
  async createInventoryItem(item: InsertInventoryItem) {
    const { data, error } = await supabase
      .from('inventory')
      .insert([item])
      .select();
    
    if (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
    
    return data?.[0];
  },
  
  // Update inventory item
  async updateInventoryItem(id: number, updates: UpdateInventoryItem) {
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
  },
  
  // Get low stock items
  async getLowStockItems() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .lt('quantity', 'min_stock');
    
    if (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
    
    return data || [];
  },
  
  // Restock inventory item
  async restockItem(id: number, quantity: number) {
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
  },
  
  // Search inventory items
  async searchInventory(query: string) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .or(`item_name.ilike.%${query}%,sku.ilike.%${query}%,type.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
    
    return data || [];
  }
};