import { supabase } from '../supabaseClient';

export interface InventoryItem {
  id: number;
  item_name: string;
  sku: string;
  type: string;
  quantity: number;
  min_stock: number;
  unit_price: number;
  supplier_id?: number;
  description?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id?: number;
  inventory_id: number;
  transaction_type: string; // 'stock_in', 'stock_out', 'adjustment', 'order'
  quantity: number;
  order_id?: string;
  order_request_id?: number;
  created_by: string;
  notes?: string;
  created_at?: string;
}

export type InsertInventoryItem = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInventoryItem = Partial<InsertInventoryItem>;
export type InsertInventoryTransaction = Omit<InventoryTransaction, 'id' | 'created_at'>;

export const inventoryService = {
  async getInventoryItems() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Unexpected error in getInventoryItems:', error);
      throw error;
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
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getInventoryItemById:`, error);
      throw error;
    }
  },
  
  async getInventoryItemByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .ilike('item_name', name)
        .single();
      
      if (error) {
        console.error(`Error fetching inventory item with name ${name}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error in getInventoryItemByName:`, error);
      throw error;
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
  
  async addInventoryTransaction(transaction: InsertInventoryTransaction) {
    try {
      // First, get the current item to verify the quantity
      const { data: item, error: itemError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', transaction.inventory_id)
        .single();
      
      if (itemError) {
        console.error(`Error fetching inventory item with ID ${transaction.inventory_id}:`, itemError);
        throw itemError;
      }
      
      // Calculate new quantity based on transaction type
      let newQuantity = item.quantity;
      if (transaction.transaction_type === 'stock_in') {
        newQuantity += transaction.quantity;
      } else if (transaction.transaction_type === 'stock_out' || transaction.transaction_type === 'order') {
        newQuantity = Math.max(0, newQuantity - transaction.quantity);
      }
      
      // Add transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert([{
          inventory_id: transaction.inventory_id,
          transaction_type: transaction.transaction_type,
          quantity: transaction.quantity,
          order_id: transaction.order_id,
          order_request_id: transaction.order_request_id,
          created_by: transaction.created_by,
          notes: transaction.notes
        }])
        .select();
      
      if (transactionError) {
        console.error('Error adding inventory transaction:', transactionError);
        throw transactionError;
      }
      
      // Update inventory quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', transaction.inventory_id)
        .select();
      
      if (updateError) {
        console.error(`Error updating inventory quantity for item ID ${transaction.inventory_id}:`, updateError);
        throw updateError;
      }
      
      return {
        transaction: transactionData?.[0],
        newQuantity,
        item: updatedItem?.[0]
      };
    } catch (error) {
      console.error('Unexpected error in addInventoryTransaction:', error);
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
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Unexpected error in getLowStockItems:', error);
      throw error;
    }
  },
  
  async processOrderItems(orderRequestId: number, orderId: string, items: any[], createdBy: string = 'system') {
    try {
      // Process each item in the order
      const results = [];
      
      for (const item of items) {
        // Find corresponding inventory item
        const { data: inventoryItems, error: searchError } = await supabase
          .from('inventory')
          .select('*')
          .ilike('item_name', `%${item.product_name}%`)
          .limit(1);
        
        if (searchError) {
          console.error(`Error searching for inventory item ${item.product_name}:`, searchError);
          continue; // Skip this item but process others
        }
        
        if (!inventoryItems || inventoryItems.length === 0) {
          console.warn(`No matching inventory item found for ${item.product_name}`);
          continue; // Skip this item but process others
        }
        
        const inventoryItem = inventoryItems[0];
        
        // Create transaction to deduct from inventory
        try {
          const result = await this.addInventoryTransaction({
            inventory_id: inventoryItem.id,
            transaction_type: 'order',
            quantity: item.quantity,
            order_id: orderId,
            order_request_id: orderRequestId,
            created_by: createdBy,
            notes: `Deducted for order ${orderId}`
          });
          
          results.push(result);
        } catch (transactionError) {
          console.error(`Error processing inventory for ${item.product_name}:`, transactionError);
          // Continue with other items
        }
      }
      
      return results;
    } catch (error) {
      console.error('Unexpected error in processOrderItems:', error);
      throw error;
    }
  },
  
  async getInventoryTransactions(inventoryId: number) {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching transactions for inventory ID ${inventoryId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Unexpected error in getInventoryTransactions:', error);
      return [];
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
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Unexpected error in searchInventory:', error);
      throw error;
    }
  }
}