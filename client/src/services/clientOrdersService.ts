import { supabase } from '../supabaseClient';
import { orderRequestsService } from './orderRequestsService';

export interface ClientOrder {
  id: number;
  order_id: string;
  client_id: number;
  date: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
  notes?: string;
  clients?: any; 
  items?: any[];
  order_request_id?: number;
}

export type InsertClientOrder = Omit<ClientOrder, 'id' | 'created_at' | 'updated_at' | 'clients' | 'items'>;
export type UpdateClientOrder = Partial<InsertClientOrder>;

export const clientOrdersService = {
  async getClientOrders() {
    try {
      const orderRequests = await orderRequestsService.getAllOrderRequests();
      const approvedOrRejectedOrders = orderRequests
        .filter(request => ['Approved', 'Rejected', 'Completed'].includes(request.status))
        .map(request => ({
          id: request.id,
          order_id: request.request_id,
          client_id: request.client_id,
          date: request.date,
          amount: request.total_amount || 0,
          status: request.status,
          created_at: request.created_at,
          updated_at: request.updated_at,
          notes: request.notes,
          clients: request.clients,
          items: request.items,
          order_request_id: request.id
        }));
      
      // Then check if we have a client_orders table - if so, get from there too
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('*, clients(*)')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching client orders from database:', error);
          return approvedOrRejectedOrders;
        }
        
        if (!data || data.length === 0) {
          return approvedOrRejectedOrders;
        }
        
        // Get items for these orders
        const orderIds = data.map(order => order.order_request_id).filter(id => id); // Filter out nulls
        
        let itemsByOrderId: Record<number, any[]> = {};
        
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_request_items')
            .select('*')
            .in('order_request_id', orderIds);
            
          if (itemsData) {
            // Group items by order_request_id
            itemsByOrderId = itemsData.reduce((acc: Record<number, any[]>, item: any) => {
              if (!acc[item.order_request_id]) {
                acc[item.order_request_id] = [];
              }
              acc[item.order_request_id].push(item);
              return acc;
            }, {});
          }
        }
        
        // Merge orders from client_orders table with items
        const ordersWithItems = data.map((order: any) => ({
          ...order,
          items: order.order_request_id ? itemsByOrderId[order.order_request_id] || [] : []
        }));
        
        // Merge with orders from order_requests
        // Use a Map to avoid duplicates (by order_id)
        const orderMap = new Map();
        
        // First add orders from client_orders table
        ordersWithItems.forEach(order => {
          orderMap.set(order.order_id, order);
        });
        
        // Then add orders from order_requests that aren't already in the map
        approvedOrRejectedOrders.forEach(order => {
          if (!orderMap.has(order.order_id)) {
            orderMap.set(order.order_id, order);
          }
        });
        
        return Array.from(orderMap.values());
      } catch (dbError) {
        console.error('Error accessing client_orders table:', dbError);
        return approvedOrRejectedOrders;
      }
    } catch (error) {
      console.error('Unexpected error in getClientOrders:', error);
      return [];
    }
  },
  
  async getClientOrderById(id: number) {
    try {
      // First check if it exists in client_orders table
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('*, clients(*)')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          // Get items if this order has an order_request_id
          if (data.order_request_id) {
            const items = await orderRequestsService.getOrderRequestItems(data.order_request_id);
            return {
              ...data,
              items
            };
          }
          return data;
        }
      } catch (dbError) {
        console.error('Error checking client_orders table:', dbError);
        // Continue to check order_requests
      }
      
      // If not found in client_orders, check in order_requests
      const orderRequest = await orderRequestsService.getOrderRequestById(id);
      
      if (orderRequest && ['Approved', 'Rejected', 'Completed'].includes(orderRequest.status)) {
        return {
          id: orderRequest.id,
          order_id: orderRequest.request_id,
          client_id: orderRequest.client_id,
          date: orderRequest.date,
          amount: orderRequest.total_amount || 0,
          status: orderRequest.status,
          created_at: orderRequest.created_at,
          updated_at: orderRequest.updated_at,
          notes: orderRequest.notes,
          clients: orderRequest.clients,
          items: orderRequest.items,
          order_request_id: orderRequest.id
        };
      }
      
      throw new Error(`Client order with ID ${id} not found`);
    } catch (error) {
      console.error(`Unexpected error in getClientOrderById:`, error);
      throw error;
    }
  },
  
  async getClientOrdersByClientId(clientId: number) {
    try {
      // First check client_orders table
      let clientOrders: ClientOrder[] = [];
      
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('*, clients(*)')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          clientOrders = data;
        }
      } catch (dbError) {
        console.error('Error checking client_orders table:', dbError);
      }
      
      // Then check order_requests
      const orderRequests = await orderRequestsService.getAllOrderRequests();
      
      const approvedOrders = orderRequests
        .filter(request => 
          request.client_id === clientId && 
          ['Approved', 'Rejected', 'Completed'].includes(request.status))
        .map(request => ({
          id: request.id,
          order_id: request.request_id,
          client_id: request.client_id,
          date: request.date,
          amount: request.total_amount || 0,
          status: request.status,
          created_at: request.created_at,
          updated_at: request.updated_at,
          notes: request.notes,
          clients: request.clients,
          items: request.items,
          order_request_id: request.id
        }));
      
      // Merge results, removing duplicates by order_id
      const orderMap = new Map();
      
      // First add from client_orders
      clientOrders.forEach(order => {
        orderMap.set(order.order_id, order);
      });
      
      // Then add from order_requests if not already in the map
      approvedOrders.forEach(order => {
        if (!orderMap.has(order.order_id)) {
          orderMap.set(order.order_id, order);
        }
      });
      
      return Array.from(orderMap.values());
    } catch (error) {
      console.error(`Unexpected error in getClientOrdersByClientId:`, error);
      return [];
    }
  },
  
  async getClientOrdersByStatus(status: string) {
    try {
      // Get from client_orders table
      let statusOrders: ClientOrder[] = [];
      
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('*, clients(*)')
          .eq('status', status)
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          statusOrders = data;
        }
      } catch (dbError) {
        console.error('Error checking client_orders table:', dbError);
      }
      
      // Get from order_requests
      const orderRequests = await orderRequestsService.getAllOrderRequests();
      
      const filteredOrders = orderRequests
        .filter(request => request.status === status)
        .map(request => ({
          id: request.id,
          order_id: request.request_id,
          client_id: request.client_id,
          date: request.date,
          amount: request.total_amount || 0,
          status: request.status,
          created_at: request.created_at,
          updated_at: request.updated_at,
          notes: request.notes,
          clients: request.clients,
          items: request.items,
          order_request_id: request.id
        }));
      
      // Merge results, removing duplicates by order_id
      const orderMap = new Map();
      
      // First add from client_orders
      statusOrders.forEach(order => {
        orderMap.set(order.order_id, order);
      });
      
      // Then add from order_requests if not already in the map
      filteredOrders.forEach(order => {
        if (!orderMap.has(order.order_id)) {
          orderMap.set(order.order_id, order);
        }
      });
      
      return Array.from(orderMap.values());
    } catch (error) {
      console.error(`Unexpected error in getClientOrdersByStatus:`, error);
      return [];
    }
  },
  
  async createClientOrder(clientOrder: InsertClientOrder) {
    try {
      // Check if we have a client_orders table
      let useClientOrdersTable = true;
      
      try {
        const { error } = await supabase
          .from('client_orders')
          .select('count')
          .limit(1);
          
        if (error) {
          console.warn('client_orders table may not exist, using order_requests only');
          useClientOrdersTable = false;
        }
      } catch (checkError) {
        console.warn('Error checking client_orders table:', checkError);
        useClientOrdersTable = false;
      }
      
      if (!useClientOrdersTable) {
        // Find the associated order request
        const { data: orderRequestData, error: findError } = await supabase
          .from('order_requests')
          .select('id')
          .eq('request_id', clientOrder.order_id)
          .single();
          
        if (findError || !orderRequestData) {
          console.error('Error finding order request:', findError);
          throw new Error('Cannot create client order: associated order request not found');
        }
        
        // Update the status in order_requests instead
        const updatedOrder = await orderRequestsService.changeRequestStatus(
          orderRequestData.id,
          clientOrder.status
        );
        
        return {
          id: updatedOrder.id,
          order_id: updatedOrder.request_id,
          client_id: updatedOrder.client_id,
          date: updatedOrder.date,
          amount: updatedOrder.total_amount || 0,
          status: updatedOrder.status,
          created_at: updatedOrder.created_at,
          updated_at: updatedOrder.updated_at,
          notes: updatedOrder.notes || '',
          order_request_id: updatedOrder.id
        };
      }
      
      // If we have a client_orders table, create a record there
      // First, find the original order request ID
      let order_request_id: number | null = null;
      try {
        const { data: requestData } = await supabase
          .from('order_requests')
          .select('id')
          .eq('request_id', clientOrder.order_id)
          .single();
          
        if (requestData) {
          order_request_id = requestData.id;
        }
      } catch (findError) {
        console.warn('Could not find original order request:', findError);
      }
      
      const orderWithTimestamp = {
        ...clientOrder,
        order_request_id,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('client_orders')
        .insert([orderWithTimestamp])
        .select();
      
      if (error) {
        console.error('Error creating client order:', error);
        throw error;
      }
      
      // If we also have the order in order_requests, update its status
      if (order_request_id) {
        try {
          await orderRequestsService.changeRequestStatus(
            order_request_id,
            clientOrder.status
          );
        } catch (updateError) {
          console.warn('Could not update original order request status:', updateError);
        }
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Unexpected error in createClientOrder:', error);
      throw error;
    }
  },
  
  async updateClientOrder(id: number, updates: UpdateClientOrder) {
    try {
      // First check if this order exists in client_orders table
      let useClientOrdersTable = true;
      let orderRequestId: number | null = null;
      
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('id, order_request_id')
          .eq('id', id)
          .single();
          
        if (error || !data) {
          console.warn('Order not found in client_orders, will check order_requests:', error);
          useClientOrdersTable = false;
        } else {
          orderRequestId = data.order_request_id;
        }
      } catch (checkError) {
        console.warn('Error checking client_orders table:', checkError);
        useClientOrdersTable = false;
      }
      
      if (!useClientOrdersTable) {
        // Check if it exists in order_requests
        const orderRequest = await orderRequestsService.getOrderRequestById(id);
        
        if (!orderRequest) {
          throw new Error(`Order with ID ${id} not found in any table`);
        }
        
        // Update the order request directly
        const updatedData: any = { ...updates };
        if (updates.amount !== undefined) {
          updatedData.total_amount = updates.amount;
        }
        
        const updatedOrder = await orderRequestsService.updateOrderRequest(id, updatedData);
        
        return {
          id: updatedOrder.id,
          order_id: updatedOrder.request_id,
          client_id: updatedOrder.client_id,
          date: updatedOrder.date,
          amount: updatedOrder.total_amount || 0,
          status: updatedOrder.status,
          created_at: updatedOrder.created_at,
          updated_at: updatedOrder.updated_at,
          notes: updatedOrder.notes || '',
          order_request_id: updatedOrder.id
        };
      }
      
      // Update in client_orders table
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('client_orders')
        .update(updatedData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error updating client order with ID ${id}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error(`No data returned after updating client order with ID ${id}`);
      }
      
      // If there's an associated order request, update its status as well
      if (orderRequestId && updates.status) {
        try {
          await orderRequestsService.changeRequestStatus(
            orderRequestId,
            updates.status
          );
        } catch (updateError) {
          console.warn('Could not update original order request status:', updateError);
        }
      }
      
      return data[0];
    } catch (error) {
      console.error('Unexpected error in updateClientOrder:', error);
      throw error;
    }
  },
  
  async changeOrderStatus(id: number, status: string) {
    try {
      console.log(`Changing order status for order ID ${id} to ${status}`);
      
      // First check if this order exists in client_orders table
      let useClientOrdersTable = true;
      let orderRequestId: number | null = null;
      
      try {
        const { data, error } = await supabase
          .from('client_orders')
          .select('id, order_request_id')
          .eq('id', id)
          .single();
          
        if (error || !data) {
          console.warn('Order not found in client_orders, will check order_requests:', error);
          useClientOrdersTable = false;
        } else {
          orderRequestId = data.order_request_id;
          console.log(`Found order in client_orders with order_request_id: ${orderRequestId}`);
        }
      } catch (checkError) {
        console.warn('Error checking client_orders table:', checkError);
        useClientOrdersTable = false;
      }
      
      // Special handling for Pending status
      if (status === 'Pending') {
        console.log(`Transitioning order back to Pending status`);
        
        // If we have a client_orders table and an orderRequestId, handle the transition back to Order Requests
        if (useClientOrdersTable && orderRequestId) {
          try {
            console.log(`Updating order_requests status to Pending for order_request_id: ${orderRequestId}`);
            
            // Update the order_requests status first
            const { data: updatedRequest, error: updateError } = await supabase
              .from('order_requests')
              .update({ 
                status: 'Pending',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderRequestId)
              .select();
              
            if (updateError) {
              console.error(`Error updating order_requests status for ID ${orderRequestId}:`, updateError);
              throw updateError;
            }
            
            console.log(`Successfully updated order_requests status, now removing from client_orders`);
            
            // Then delete from client_orders
            const { error: deleteError } = await supabase
              .from('client_orders')
              .delete()
              .eq('id', id);
              
            if (deleteError) {
              console.error(`Error removing client order with ID ${id}:`, deleteError);
              throw deleteError;
            }
            
            console.log(`Successfully transitioned order back to Pending status`);
            
            // Return the updated order request data for consistency
            return {
              ...updatedRequest[0],
              id: id,  // Make sure we return the ID the caller expects
              order_id: updatedRequest[0].request_id,
              amount: updatedRequest[0].total_amount,
              status: 'Pending'
            };
          } catch (transitionError) {
            console.error('Error transitioning order back to requests:', transitionError);
            throw transitionError;
          }
        } else if (!useClientOrdersTable) {
          // If we're only using order_requests, just update the status there
          console.log(`Updating status directly in order_requests to Pending for ID ${id}`);
          return await orderRequestsService.changeRequestStatus(id, status);
        } else {
          // We have a client_orders record but no order_request_id - this shouldn't happen
          // but we'll handle it by just updating the status
          console.warn(`Client order ${id} has no linked order_request_id, cannot properly transition to Pending`);
          
          const { data, error } = await supabase
            .from('client_orders')
            .update({ 
              status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
          
          if (error) {
            console.error(`Error updating client order with ID ${id}:`, error);
            throw error;
          }
          
          if (!data || data.length === 0) {
            throw new Error(`No data returned after updating status for client order with ID ${id}`);
          }
          
          return data[0];
        }
      }
      
      // Regular status changes (not Pending)
      if (!useClientOrdersTable) {
        // If the order is not in client_orders, assume it's in order_requests
        console.log(`Updating status directly in order_requests to ${status} for ID ${id}`);
        return await orderRequestsService.changeRequestStatus(id, status);
      }
      
      // Update the client_orders record
      console.log(`Updating status in client_orders to ${status} for ID ${id}`);
      const { data, error } = await supabase
        .from('client_orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Error changing status for client order with ID ${id}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error(`No data returned after updating status for client order with ID ${id}`);
      }
      
      // If there's an associated order request, update its status as well
      if (orderRequestId) {
        try {
          console.log(`Updating order_requests status to ${status} for order_request_id: ${orderRequestId}`);
          await orderRequestsService.changeRequestStatus(
            orderRequestId,
            status
          );
        } catch (updateError) {
          console.warn('Could not update original order request status:', updateError);
        }
      }
      
      console.log(`Successfully changed order status to ${status}`);
      return data[0];
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
        
        return await orderRequestsService.generateRequestId();
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
      
      return await orderRequestsService.generateRequestId();
    }
  }
};