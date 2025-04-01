import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';
import { Payroll, PayrollFilters, payrollService } from '../../services/payrollService';

interface PayrollState {
  payrollRecords: Payroll[];
  currentRecord: Payroll | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  payrollRecords: [],
  currentRecord: null,
  isLoading: false,
  error: null
};

// Async thunks that use direct Supabase services as fallback
export const fetchPayrolls = createAsyncThunk(
  'payroll/fetchPayrolls',
  async (filters: PayrollFilters | undefined = undefined, { rejectWithValue }) => {
    try {
      // Try API first
      const response = await apiClient.get('/payroll', { params: filters });
      return response.data.data;
    } catch (error: any) {
      console.log('API error, falling back to direct service:', error);
      try {
        // Fallback to direct service
        return await payrollService.getPayrolls(filters);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch payroll records');
      }
    }
  }
);

export const fetchPayrollsByEmployeeId = createAsyncThunk(
  'payroll/fetchPayrollsByEmployeeId',
  async (employeeId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payroll/employee/${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      try {
        return await payrollService.getPayrollsByEmployeeId(employeeId);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch employee payroll records');
      }
    }
  }
);

export const fetchPayrollById = createAsyncThunk(
  'payroll/fetchPayrollById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/payroll/${id}`);
      return response.data.data;
    } catch (error: any) {
      try {
        return await payrollService.getPayrollById(id);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch payroll record');
      }
    }
  }
);

export const createPayroll = createAsyncThunk(
  'payroll/createPayroll',
  async (payrollData: Omit<Payroll, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/payroll', payrollData);
      return response.data.data;
    } catch (error: any) {
      try {
        return await payrollService.createPayroll(payrollData);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create payroll record');
      }
    }
  }
);

export const updatePayroll = createAsyncThunk(
  'payroll/updatePayroll',
  async ({ id, data }: { id: number; data: Partial<Payroll> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/payroll/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      try {
        return await payrollService.updatePayroll(id, data);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to update payroll record');
      }
    }
  }
);

export const bulkCreatePayroll = createAsyncThunk(
  'payroll/bulkCreatePayroll',
  async (payrollRecords: Array<Omit<Payroll, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/payroll/bulk', { records: payrollRecords });
      return response.data.data;
    } catch (error: any) {
      try {
        const count = await payrollService.bulkCreatePayroll(payrollRecords);
        return { count };
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create payroll records in bulk');
      }
    }
  }
);

export const deletePayroll = createAsyncThunk(
  'payroll/deletePayroll',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/payroll/${id}`);
      return id;
    } catch (error: any) {
      try {
        await payrollService.deletePayroll(id);
        return id;
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to delete payroll record');
      }
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all payroll records
      .addCase(fetchPayrolls.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrollRecords = action.payload;
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch payroll by employee ID
      .addCase(fetchPayrollsByEmployeeId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollsByEmployeeId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrollRecords = action.payload;
      })
      .addCase(fetchPayrollsByEmployeeId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single payroll record
      .addCase(fetchPayrollById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecord = action.payload;
      })
      .addCase(fetchPayrollById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create payroll record
      .addCase(createPayroll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPayroll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrollRecords.unshift(action.payload);
        state.currentRecord = action.payload;
      })
      .addCase(createPayroll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update payroll record
      .addCase(updatePayroll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePayroll.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.payrollRecords.findIndex(record => record.id === action.payload.id);
        if (index !== -1) {
          state.payrollRecords[index] = action.payload;
        }
        state.currentRecord = action.payload;
      })
      .addCase(updatePayroll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Bulk create payroll records
      .addCase(bulkCreatePayroll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkCreatePayroll.fulfilled, (state) => {
        state.isLoading = false;
        // Note: we don't update state here because we'd need to fetch the records again 
        // to get the IDs and full data
      })
      .addCase(bulkCreatePayroll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete payroll record
      .addCase(deletePayroll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePayroll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrollRecords = state.payrollRecords.filter(record => record.id !== action.payload);
        if (state.currentRecord && state.currentRecord.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deletePayroll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentRecord, clearError } = payrollSlice.actions;
export default payrollSlice.reducer;