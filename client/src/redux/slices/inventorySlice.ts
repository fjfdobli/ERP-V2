import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';
import { inventoryService } from '../../services/inventoryService';

interface InventoryItem {
  id: string;
  itemName: string;
  itemType: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  minStockLevel: number;
  supplierId?: string;
  supplier?: {
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryTransaction {
  id: string;
  inventoryId: string;
  transactionType: string;
  quantity: number;
  orderId?: string;
  createdBy: string;
  createdAt: string;
}

interface InventoryState {
  inventoryItems: InventoryItem[];
  lowStockItems: InventoryItem[];
  currentItem: InventoryItem | null;
  transactions: InventoryTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventoryItems: [],
  lowStockItems: [],
  currentItem: null,
  transactions: [],
  isLoading: false,
  error: null
};

// Map service items to the format expected by the application
const mapServiceItemToInventoryItem = (item: any): InventoryItem => {
  return {
    id: item.id?.toString() || '',
    itemName: item.item_name || '',
    itemType: item.type || '',
    sku: item.sku || '',
    quantity: item.quantity || 0,
    unitPrice: 0, // Default as the service doesn't have this
    minStockLevel: item.min_stock || 0,
    createdAt: item.created_at
  };
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      try {
        // First try the API
        const response = await apiClient.get('/inventory');
        return response.data.data;
      } catch (apiError) {
        // On API failure, use the inventory service with mock data
        console.log('API fetch failed, using inventory service');
        const items = await inventoryService.getInventoryItems();
        return items.map(mapServiceItemToInventoryItem);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory');
    }
  }
);

export const fetchLowStockItems = createAsyncThunk(
  'inventory/fetchLowStockItems',
  async (_, { rejectWithValue }) => {
    try {
      try {
        // First try the API
        const response = await apiClient.get('/inventory/low-stock');
        return response.data.data;
      } catch (apiError) {
        // On API failure, use the inventory service with mock data
        console.log('API fetch failed, using inventory service for low stock');
        const items = await inventoryService.getLowStockItems();
        return items.map(mapServiceItemToInventoryItem);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch low stock items');
    }
  }
);

export const fetchInventoryItemById = createAsyncThunk(
  'inventory/fetchInventoryItemById',
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const response = await apiClient.get(`/inventory/${id}`);
        return response.data.data;
      } catch (apiError) {
        // On API failure, use the inventory service with mock data
        const item = await inventoryService.getInventoryItemById(parseInt(id));
        return mapServiceItemToInventoryItem(item);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory item');
    }
  }
);

export const createInventoryItem = createAsyncThunk(
  'inventory/createInventoryItem',
  async (itemData: Partial<InventoryItem>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/inventory', itemData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create inventory item');
    }
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateInventoryItem',
  async ({ id, data }: { id: string; data: Partial<InventoryItem> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/inventory/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update inventory item');
    }
  }
);

export const addInventoryTransaction = createAsyncThunk(
  'inventory/addInventoryTransaction',
  async ({ 
    inventoryId, 
    transactionData 
  }: { 
    inventoryId: string; 
    transactionData: Partial<InventoryTransaction>
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/inventory/${inventoryId}/transactions`, transactionData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add inventory transaction');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventoryItems = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.inventoryItems = []; // Empty data on error
      })
      
      .addCase(fetchLowStockItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lowStockItems = action.payload;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.lowStockItems = []; // Empty data on error
      })
      
      .addCase(fetchInventoryItemById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItemById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchInventoryItemById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createInventoryItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventoryItems.push(action.payload);
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateInventoryItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.inventoryItems.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.inventoryItems[index] = action.payload;
        }
        state.currentItem = action.payload;
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(addInventoryTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addInventoryTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.push(action.payload.transaction);
        
        if (state.currentItem && state.currentItem.id === action.payload.transaction.inventoryId) {
          state.currentItem.quantity = action.payload.newQuantity;
        }
        
        const index = state.inventoryItems.findIndex(item => 
          item.id === action.payload.transaction.inventoryId
        );
        if (index !== -1) {
          state.inventoryItems[index].quantity = action.payload.newQuantity;
        }
      })
      .addCase(addInventoryTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentItem, clearError } = inventorySlice.actions;
export default inventorySlice.reducer;