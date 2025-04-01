import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';
import { Machinery, MachineryFilters, MaintenanceRecord, machineryService } from '../../services/machineryService';

interface MachineryState {
  machinery: Machinery[];
  currentMachinery: Machinery | null;
  maintenanceRecords: MaintenanceRecord[];
  currentRecord: MaintenanceRecord | null;
  machineryStats: any;
  maintenanceCostSummary: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: MachineryState = {
  machinery: [],
  currentMachinery: null,
  maintenanceRecords: [],
  currentRecord: null,
  machineryStats: null,
  maintenanceCostSummary: null,
  isLoading: false,
  error: null
};

// Machinery operations
export const fetchMachinery = createAsyncThunk(
  'machinery/fetchMachinery',
  async (filters: MachineryFilters | undefined = undefined, { rejectWithValue }) => {
    try {
      // Try API first
      const response = await apiClient.get('/machinery', { params: filters });
      return response.data.data;
    } catch (error: any) {
      console.log('API error, falling back to direct service:', error);
      try {
        // Fallback to direct service
        return await machineryService.getMachinery(filters);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch machinery');
      }
    }
  }
);

export const fetchMachineryById = createAsyncThunk(
  'machinery/fetchMachineryById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/machinery/${id}`);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.getMachineryById(id);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch machinery');
      }
    }
  }
);

export const createMachinery = createAsyncThunk(
  'machinery/createMachinery',
  async (machineryData: Omit<Machinery, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/machinery', machineryData);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.createMachinery(machineryData);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create machinery');
      }
    }
  }
);

export const updateMachinery = createAsyncThunk(
  'machinery/updateMachinery',
  async ({ id, data }: { id: number; data: Partial<Machinery> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/machinery/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.updateMachinery(id, data);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to update machinery');
      }
    }
  }
);

export const deleteMachinery = createAsyncThunk(
  'machinery/deleteMachinery',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/machinery/${id}`);
      return id;
    } catch (error: any) {
      try {
        await machineryService.deleteMachinery(id);
        return id;
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to delete machinery');
      }
    }
  }
);

// Maintenance record operations
export const fetchMaintenanceRecords = createAsyncThunk(
  'machinery/fetchMaintenanceRecords',
  async (machineryId: number | undefined = undefined, { rejectWithValue }) => {
    try {
      const url = machineryId 
        ? `/maintenance-records?machineryId=${machineryId}` 
        : '/maintenance-records';
        
      const response = await apiClient.get(url);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.getMaintenanceRecords(machineryId);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch maintenance records');
      }
    }
  }
);

export const createMaintenanceRecord = createAsyncThunk(
  'machinery/createMaintenanceRecord',
  async (recordData: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/maintenance-records', recordData);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.createMaintenanceRecord(recordData);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create maintenance record');
      }
    }
  }
);

export const updateMaintenanceRecord = createAsyncThunk(
  'machinery/updateMaintenanceRecord',
  async ({ id, data }: { id: number; data: Partial<MaintenanceRecord> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/maintenance-records/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.updateMaintenanceRecord(id, data);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to update maintenance record');
      }
    }
  }
);

export const deleteMaintenanceRecord = createAsyncThunk(
  'machinery/deleteMaintenanceRecord',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/maintenance-records/${id}`);
      return id;
    } catch (error: any) {
      try {
        await machineryService.deleteMaintenanceRecord(id);
        return id;
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to delete maintenance record');
      }
    }
  }
);

// Stats operations
export const fetchMachineryStats = createAsyncThunk(
  'machinery/fetchMachineryStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/machinery/stats');
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.getMachineryStats();
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch machinery statistics');
      }
    }
  }
);

export const fetchMaintenanceCostSummary = createAsyncThunk(
  'machinery/fetchMaintenanceCostSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/maintenance-records/cost-summary');
      return response.data.data;
    } catch (error: any) {
      try {
        return await machineryService.getMaintenanceCostSummary();
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch maintenance cost summary');
      }
    }
  }
);

const machinerySlice = createSlice({
  name: 'machinery',
  initialState,
  reducers: {
    clearCurrentMachinery: (state) => {
      state.currentMachinery = null;
    },
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch machinery
      .addCase(fetchMachinery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMachinery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.machinery = action.payload;
      })
      .addCase(fetchMachinery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch machinery by ID
      .addCase(fetchMachineryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMachineryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMachinery = action.payload;
      })
      .addCase(fetchMachineryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create machinery
      .addCase(createMachinery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMachinery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.machinery.push(action.payload);
        state.currentMachinery = action.payload;
      })
      .addCase(createMachinery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update machinery
      .addCase(updateMachinery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMachinery.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.machinery.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.machinery[index] = action.payload;
        }
        state.currentMachinery = action.payload;
      })
      .addCase(updateMachinery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete machinery
      .addCase(deleteMachinery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMachinery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.machinery = state.machinery.filter(item => item.id !== action.payload);
        if (state.currentMachinery && state.currentMachinery.id === action.payload) {
          state.currentMachinery = null;
        }
      })
      .addCase(deleteMachinery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch maintenance records
      .addCase(fetchMaintenanceRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.maintenanceRecords = action.payload;
      })
      .addCase(fetchMaintenanceRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create maintenance record
      .addCase(createMaintenanceRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMaintenanceRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.maintenanceRecords.unshift(action.payload);
        state.currentRecord = action.payload;
        
        // Also update the machinery's last maintenance date if this record belongs to current machinery
        if (state.currentMachinery && state.currentMachinery.id === action.payload.machineryId) {
          state.currentMachinery.lastMaintenanceDate = action.payload.date;
        }
      })
      .addCase(createMaintenanceRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update maintenance record
      .addCase(updateMaintenanceRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMaintenanceRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.maintenanceRecords.findIndex(record => record.id === action.payload.id);
        if (index !== -1) {
          state.maintenanceRecords[index] = action.payload;
        }
        state.currentRecord = action.payload;
      })
      .addCase(updateMaintenanceRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete maintenance record
      .addCase(deleteMaintenanceRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMaintenanceRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.maintenanceRecords = state.maintenanceRecords.filter(record => record.id !== action.payload);
        if (state.currentRecord && state.currentRecord.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deleteMaintenanceRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch machinery stats
      .addCase(fetchMachineryStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMachineryStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.machineryStats = action.payload;
      })
      .addCase(fetchMachineryStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch maintenance cost summary
      .addCase(fetchMaintenanceCostSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceCostSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.maintenanceCostSummary = action.payload;
      })
      .addCase(fetchMaintenanceCostSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentMachinery, clearCurrentRecord, clearError } = machinerySlice.actions;
export default machinerySlice.reducer;