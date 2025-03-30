import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderRequestsService, OrderRequest, InsertOrderRequest, UpdateOrderRequest } from '../../services/orderRequestsService';

interface OrderRequestState {
  orderRequests: OrderRequest[];
  currentOrderRequest: OrderRequest | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrderRequestState = {
  orderRequests: [],
  currentOrderRequest: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchOrderRequests = createAsyncThunk(
  'orderRequests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await orderRequestsService.getOrderRequests();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order requests');
    }
  }
);

export const fetchOrderRequestById = createAsyncThunk(
  'orderRequests/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await orderRequestsService.getOrderRequestById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order request');
    }
  }
);

export const createOrderRequest = createAsyncThunk(
  'orderRequests/create',
  async (orderRequest: InsertOrderRequest, { rejectWithValue }) => {
    try {
      return await orderRequestsService.createOrderRequest(orderRequest);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create order request');
    }
  }
);

export const updateOrderRequest = createAsyncThunk(
  'orderRequests/update',
  async ({ id, updates }: { id: number; updates: UpdateOrderRequest }, { rejectWithValue }) => {
    try {
      return await orderRequestsService.updateOrderRequest(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update order request');
    }
  }
);

export const changeOrderRequestStatus = createAsyncThunk(
  'orderRequests/changeStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      return await orderRequestsService.changeRequestStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change order request status');
    }
  }
);

export const generateOrderRequestId = createAsyncThunk(
  'orderRequests/generateId',
  async (_, { rejectWithValue }) => {
    try {
      return await orderRequestsService.generateRequestId();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate order request ID');
    }
  }
);

const orderRequestsSlice = createSlice({
  name: 'orderRequests',
  initialState,
  reducers: {
    clearCurrentOrderRequest: (state) => {
      state.currentOrderRequest = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all order requests
      .addCase(fetchOrderRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderRequests = action.payload;
      })
      .addCase(fetchOrderRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch order request by ID
      .addCase(fetchOrderRequestById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderRequestById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrderRequest = action.payload;
      })
      .addCase(fetchOrderRequestById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create order request
      .addCase(createOrderRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrderRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderRequests.unshift(action.payload);
      })
      .addCase(createOrderRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update order request
      .addCase(updateOrderRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orderRequests.findIndex((req) => req.id === action.payload.id);
        if (index !== -1) {
          state.orderRequests[index] = action.payload;
        }
        if (state.currentOrderRequest?.id === action.payload.id) {
          state.currentOrderRequest = action.payload;
        }
      })
      .addCase(updateOrderRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change order request status
      .addCase(changeOrderRequestStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeOrderRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orderRequests.findIndex((req) => req.id === action.payload.id);
        if (index !== -1) {
          state.orderRequests[index] = action.payload;
        }
        if (state.currentOrderRequest?.id === action.payload.id) {
          state.currentOrderRequest = action.payload;
        }
      })
      .addCase(changeOrderRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentOrderRequest, setError } = orderRequestsSlice.actions;
export default orderRequestsSlice.reducer;