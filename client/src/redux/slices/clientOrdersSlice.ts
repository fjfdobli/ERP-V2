// src/redux/slices/clientOrdersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientOrdersService, ClientOrder, InsertClientOrder, UpdateClientOrder } from '../../services/clientOrdersService';

interface ClientOrderState {
  clientOrders: ClientOrder[];
  currentClientOrder: ClientOrder | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientOrderState = {
  clientOrders: [],
  currentClientOrder: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchClientOrders = createAsyncThunk(
  'clientOrders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await clientOrdersService.getClientOrders();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch client orders');
    }
  }
);

export const fetchClientOrderById = createAsyncThunk(
  'clientOrders/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await clientOrdersService.getClientOrderById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch client order');
    }
  }
);

export const createClientOrder = createAsyncThunk(
  'clientOrders/create',
  async (clientOrder: InsertClientOrder, { rejectWithValue }) => {
    try {
      return await clientOrdersService.createClientOrder(clientOrder);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create client order');
    }
  }
);

export const updateClientOrder = createAsyncThunk(
  'clientOrders/update',
  async ({ id, updates }: { id: number; updates: UpdateClientOrder }, { rejectWithValue }) => {
    try {
      return await clientOrdersService.updateClientOrder(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update client order');
    }
  }
);

export const changeClientOrderStatus = createAsyncThunk(
  'clientOrders/changeStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      return await clientOrdersService.changeOrderStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change client order status');
    }
  }
);

export const generateClientOrderId = createAsyncThunk(
  'clientOrders/generateId',
  async (_, { rejectWithValue }) => {
    try {
      return await clientOrdersService.generateOrderId();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate client order ID');
    }
  }
);

const clientOrdersSlice = createSlice({
  name: 'clientOrders',
  initialState,
  reducers: {
    clearCurrentClientOrder: (state) => {
      state.currentClientOrder = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all client orders
      .addCase(fetchClientOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clientOrders = action.payload;
      })
      .addCase(fetchClientOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch client order by ID
      .addCase(fetchClientOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClientOrder = action.payload;
      })
      .addCase(fetchClientOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create client order
      .addCase(createClientOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClientOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clientOrders.unshift(action.payload);
      })
      .addCase(createClientOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update client order
      .addCase(updateClientOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClientOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clientOrders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.clientOrders[index] = action.payload;
        }
        if (state.currentClientOrder?.id === action.payload.id) {
          state.currentClientOrder = action.payload;
        }
      })
      .addCase(updateClientOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change client order status
      .addCase(changeClientOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeClientOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clientOrders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.clientOrders[index] = action.payload;
        }
        if (state.currentClientOrder?.id === action.payload.id) {
          state.currentClientOrder = action.payload;
        }
      })
      .addCase(changeClientOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentClientOrder, setError } = clientOrdersSlice.actions;
export default clientOrdersSlice.reducer;