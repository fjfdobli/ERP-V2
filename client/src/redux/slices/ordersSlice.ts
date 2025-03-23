// src/redux/slices/ordersSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';

// Types
interface OrderItem {
  id: string;
  orderId: string;
  itemName: string;
  itemType: string;
  quantity: number;
  paperType?: string;
  inkType?: string;
  size?: string;
  specifications?: string;
  unitPrice: number;
}

interface Order {
  id: string;
  orderId: string;
  clientId: string;
  client?: {
    name: string;
  };
  title: string;
  description?: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  deadline?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  orderItems?: OrderItem[];
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null
};

// Async actions
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/orders');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: Partial<Order> & { items?: Partial<OrderItem>[] }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/orders/${id}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update order status');
    }
  }
);

export const processOrder = createAsyncThunk(
  'orders/processOrder',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/orders/${id}/process`, { status });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process order');
    }
  }
);

export const addOrderItem = createAsyncThunk(
  'orders/addOrderItem',
  async ({ orderId, itemData }: { orderId: string; itemData: Partial<OrderItem> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/items`, itemData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add order item');
    }
  }
);

// Slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.push(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder && state.currentOrder.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Process order
      .addCase(processOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
      })
      .addCase(processOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add order item
      .addCase(addOrderItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addOrderItem.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentOrder) {
          if (!state.currentOrder.orderItems) {
            state.currentOrder.orderItems = [];
          }
          state.currentOrder.orderItems.push(action.payload);
        }
      })
      .addCase(addOrderItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentOrder, clearError } = ordersSlice.actions;
export default ordersSlice.reducer;