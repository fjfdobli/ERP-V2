import { supabase } from '../supabaseClient';
import { clientOrdersService } from './clientOrdersService';

export interface OrderRequest {
  id: number;
  request_id: string;
  client_id: number;
  date: string;
  type: string;
  status: string;
  total_amount?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  clients?: any;
}

export interface OrderRequestItem {
  id?: number;
  order_request_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_start?: string;
  serial_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExtendedOrderRequest extends OrderRequest {
  items?: OrderRequestItem[];
}

export type InsertOrderRequest = Omit<OrderRequest, 'id' | 'created_at' | 'updated_at' | 'clients'>;
export type UpdateOrderRequest = Partial<InsertOrderRequest>;

export const orderRequestsService = {
  async getOrderRequests(): Promise<ExtendedOrderRequest[]> {
    try {
      // Only get order requests with status New or Pending
      const { data: orders, error } = await supabase
        .from('order_requests')
        .select('*, clients(*)')
        .in('status', ['New', 'Pending'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching order requests:', error);
        return [];
      }
      
      if (!orders || orders.length === 0) {
        return [];
      }
      
      // Then get all items for these orders in a single query
      const orderIds = orders.map(order => order.id);
      const { data: allItems, error: itemsError } = await supabase
        .from('order_request_items')
        .select('*')
        .in('order_request_id', orderIds);
      
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return orders.map(order => ({
          ...order,
          items: []
        }));
      }
      
      // Match items to their respective orders
      const ordersWithItems = orders.map(order => {
        const items = allItems ? allItems.filter(item => item.order_request_id === order.id) : [];
        return {
          ...order,
          items
        };
      });
      
      return ordersWithItems;
    } catch (error) {
      console.error('Unexpected error in getOrderRequests:', error);
      return [];
    }
  },
  
  async getAllOrderRequests(): Promise<ExtendedOrderRequest[]> {
    try {
      // Get all order requests regardless of status (for admin purposes)
      const { data: orders, error } = await supabase
        .from('order_requests')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all order requests:', error);
        return [];
      }
      
      if (!orders || orders.length === 0) {
        return [];
      }
      
      // Then get all items for these orders in a single query
      const orderIds = orders.map(order => order.id);
      const { data: allItems, error: itemsError } = await supabase
        .from('order_request_items')
        .select('*')
        .in('order_request_id', orderIds);
      
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return orders.map(order => ({
          ...order,
          items: []
        }));
      }
      
      // Match items to their respective orders
      const ordersWithItems = orders.map(order => {
        const items = allItems ? allItems.filter(item => item.order_request_id === order.id) : [];
        return {
          ...order,
          items
        };
      });
      
      return ordersWithItems;
    } catch (error) {
      console.error('Unexpected error in getAllOrderRequests:', error);
      return [];
    }
  },
  
  async getOrderRequestById(id: number): Promise<ExtendedOrderRequest | null> {
    try {
      // First get the order request
      const { data: order, error } = await supabase
        .from('order_requests')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching order request with ID ${id}:`, error);
        return null;
      }
      
      // Then get its items
      const { data: items, error: itemsError } = await supabase
        .from('order_request_items')
        .select('*')
        .eq('order_request_id', id)
        .order('id');
      
      if (itemsError) {
        console.error(`Error fetching items for order request with ID ${id}:`, itemsError);
        return {
          ...order,
          items: []
        };
      }
      
      return {
        ...order,
        items: items || []
      };
    } catch (error) {
      console.error(`Unexpected error in getOrderRequestById:`, error);
      return null;
    }
  },
  
  async createOrderRequest(orderRequest: InsertOrderRequest): Promise<OrderRequest> {
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
  
  async createOrderRequestWithItems(
    orderRequest: InsertOrderRequest,
    items: OrderRequestItem[]
  ): Promise<ExtendedOrderRequest> {
    try {
      const { data: order, error } = await supabase
        .from('order_requests')
        .insert([{
          request_id: orderRequest.request_id,
          client_id: orderRequest.client_id,
          date: orderRequest.date,
          type: orderRequest.type,
          status: orderRequest.status,
          total_amount: items.reduce((sum, item) => sum + item.total_price, 0),
          notes: orderRequest.notes || ''
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating order request:', error);
        throw error;
      }

      if (!order) {
        throw new Error('Failed to create order request');
      }

      // Now insert all items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          order_request_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          serial_start: item.serial_start || null,
          serial_end: item.serial_end || null
        }));

        const { error: itemsError } = await supabase
          .from('order_request_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error adding order items:', itemsError);
          throw itemsError;
        }
      }

      // Return the created order with items
      return {
        ...order,
        items
      };
    } catch (error) {
      console.error('Unexpected error in createOrderRequestWithItems:', error);
      throw error;
    }
  },
  
  async updateOrderRequest(id: number, updates: UpdateOrderRequest): Promise<OrderRequest> {
    try {
      // Include updated_at timestamp
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('order_requests')
        .update(updatedData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating order request with ID ${id}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error(`No data returned after updating order request with ID ${id}`);
      }
      
      return data[0];
    } catch (error) {
      console.error('Unexpected error in updateOrderRequest:', error);
      throw error;
    }
  },
  
  async updateOrderRequestWithItems(
    id: number, 
    updates: UpdateOrderRequest, 
    items: OrderRequestItem[]
  ): Promise<ExtendedOrderRequest> {
    try {
      const { error: checkError } = await supabase
        .from('order_requests')
        .select('id')
        .eq('id', id)
        .single();
        
      if (checkError) {
        console.error(`Error checking order request with ID ${id}:`, checkError);
        throw new Error(`Order request with ID ${id} not found`);
      }
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Include updated_at timestamp
      const updatedData = {
        ...updates,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      };
      
      // Update the order request
      const { data: order, error } = await supabase
        .from('order_requests')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating order request with ID ${id}:`, error);
        throw error;
      }

      if (!order) {
        throw new Error(`Failed to update order request with ID ${id}`);
      }

      try {
        // Delete existing items first
        const { error: deleteError } = await supabase
          .from('order_request_items')
          .delete()
          .eq('order_request_id', id);

        if (deleteError) {
          console.error(`Error deleting existing items for order request with ID ${id}:`, deleteError);
          throw deleteError;
        }
        
        // Only insert new items if there are any
        if (items && items.length > 0) {
          // Prepare items with order_request_id
          const itemsToInsert = items.map(item => ({
            order_request_id: id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            serial_start: item.serial_start || null,
            serial_end: item.serial_end || null
          }));

          // Insert new items
          const { error: itemsError } = await supabase
            .from('order_request_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error(`Error adding updated items for order request with ID ${id}:`, itemsError);
            throw itemsError;
          }
        }
      } catch (itemError) {
        console.error(`Error managing items for order request with ID ${id}:`, itemError);
        // Continue and return the order without items rather than failing completely
      }

      // Return the updated order with items
      return {
        ...order,
        items: items || []
      };
    } catch (error) {
      console.error('Unexpected error in updateOrderRequestWithItems:', error);
      throw error;
    }
  },
  
  async changeRequestStatus(id: number, status: string): Promise<OrderRequest> {
    try {
      console.log(`Changing request status for ID ${id} to ${status}`);
      
      // First get the full order request with items
      const orderRequest = await this.getOrderRequestById(id);
      
      if (!orderRequest) {
        console.error(`Order request with ID ${id} not found`);
        throw new Error(`Order request with ID ${id} not found`);
      }
      
      // Update the status with timestamp
      const { data, error } = await supabase
        .from('order_requests')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error changing status for order request with ID ${id}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error(`No data returned after updating status for order request with ID ${id}`);
        throw new Error(`No data returned after updating status for order request with ID ${id}`);
      }
      
      // If status is Approved or Rejected, create an entry in client_orders
      if (status === 'Approved' || status === 'Rejected' || status === 'Completed') {
        try {
          console.log(`Creating client order entry for order request ${id} with status ${status}`);
          
          // Check if an entry already exists
          const { data: existingOrder, error: checkError } = await supabase
            .from('client_orders')
            .select('id')
            .eq('order_request_id', id)
            .single();
            
          if (!checkError && existingOrder) {
            console.log(`Client order already exists for order request ${id}, updating status`);
            
            // If entry exists, just update the status
            await supabase
              .from('client_orders')
              .update({ 
                status: status,
                updated_at: new Date().toISOString()
              })
              .eq('order_request_id', id);
          } else {
            // Create new client order
            await clientOrdersService.createClientOrder({
              order_id: orderRequest.request_id,
              client_id: orderRequest.client_id,
              date: orderRequest.date,
              amount: orderRequest.total_amount || 0,
              status: status,
              // Remove the order_type property as it does not exist in InsertClientOrder
              notes: orderRequest.notes || '',
              order_request_id: orderRequest.id
            });
          }
        } catch (clientOrderError) {
          console.error('Error creating or updating client order:', clientOrderError);
          // Still return success for the status change
        }
      } else if (status === 'Pending' || status === 'New') {
        // If status is back to Pending or New, remove from client_orders if it exists
        try {
          console.log(`Removing client order for order request ${id} as status is now ${status}`);
          
          const { error: deleteError } = await supabase
            .from('client_orders')
            .delete()
            .eq('order_request_id', id);
            
          if (deleteError) {
            console.warn(`Could not delete client order for order request ${id}:`, deleteError);
          }
        } catch (deleteError) {
          console.warn('Error attempting to delete client order:', deleteError);
        }
      }
      
      console.log(`Successfully changed order request ${id} status to ${status}`);
      return data[0];
    } catch (error) {
      console.error('Unexpected error in changeRequestStatus:', error);
      throw error;
    }
  },
  
  async generateRequestId(): Promise<string> {
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
        return `${prefix}00001`;
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
      return `${prefix}00001`;
    }
  },
  
  async getOrderRequestItems(orderRequestId: number): Promise<OrderRequestItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_request_items')
        .select('*')
        .eq('order_request_id', orderRequestId)
        .order('id');
      
      if (error) {
        console.error(`Error fetching items for order request ID ${orderRequestId}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`Unexpected error in getOrderRequestItems:`, error);
      return [];
    }
  },
  
  async deleteOrderRequestItem(itemId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('order_request_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        console.error(`Error deleting order request item with ID ${itemId}:`, error);
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error in deleteOrderRequestItem:', error);
      throw error;
    }
  }
};