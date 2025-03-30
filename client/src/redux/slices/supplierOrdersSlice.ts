// src/redux/slices/supplierOrdersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supplierOrdersService, SupplierOrder, InsertSupplierOrder, UpdateSupplierOrder } from '../../services/supplierOrdersService';

interface SupplierOrderState {
  supplierOrders: SupplierOrder[];
  currentSupplierOrder: SupplierOrder | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SupplierOrderState = {
  supplierOrders: [],
  currentSupplierOrder: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchSupplierOrders = createAsyncThunk(
  'supplierOrders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.getSupplierOrders();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch supplier orders');
    }
  }
);

export const fetchSupplierOrderById = createAsyncThunk(
  'supplierOrders/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.getSupplierOrderById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch supplier order');
    }
  }
);

export const createSupplierOrder = createAsyncThunk(
  'supplierOrders/create',
  async (supplierOrder: InsertSupplierOrder, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.createSupplierOrder(supplierOrder);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create supplier order');
    }
  }
);

export const updateSupplierOrder = createAsyncThunk(
  'supplierOrders/update',
  async ({ id, updates }: { id: number; updates: UpdateSupplierOrder }, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.updateSupplierOrder(id, updates);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update supplier order');
    }
  }
);

export const changeSupplierOrderStatus = createAsyncThunk(
  'supplierOrders/changeStatus',
  async ({ id, status }: { id: number; status: string }, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.changeOrderStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to change supplier order status');
    }
  }
);

export const generateSupplierOrderId = createAsyncThunk(
  'supplierOrders/generateId',
  async (_, { rejectWithValue }) => {
    try {
      return await supplierOrdersService.generatePoNumber();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate PO number');
    }
  }
);

const supplierOrdersSlice = createSlice({
  name: 'supplierOrders',
  initialState,
  reducers: {
    clearCurrentSupplierOrder: (state) => {
      state.currentSupplierOrder = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all supplier orders
      .addCase(fetchSupplierOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSupplierOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.supplierOrders = action.payload;
      })
      .addCase(fetchSupplierOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch supplier order by ID
      .addCase(fetchSupplierOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSupplierOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSupplierOrder = action.payload;
      })
      .addCase(fetchSupplierOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create supplier order
      .addCase(createSupplierOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSupplierOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.supplierOrders.unshift(action.payload);
      })
      .addCase(createSupplierOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update supplier order
      .addCase(updateSupplierOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSupplierOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.supplierOrders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.supplierOrders[index] = action.payload;
        }
        if (state.currentSupplierOrder?.id === action.payload.id) {
          state.currentSupplierOrder = action.payload;
        }
      })
      .addCase(updateSupplierOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change supplier order status
      .addCase(changeSupplierOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeSupplierOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.supplierOrders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.supplierOrders[index] = action.payload;
        }
        if (state.currentSupplierOrder?.id === action.payload.id) {
          state.currentSupplierOrder = action.payload;
        }
      })
      .addCase(changeSupplierOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentSupplierOrder, setError } = supplierOrdersSlice.actions;
export default supplierOrdersSlice.reducer;