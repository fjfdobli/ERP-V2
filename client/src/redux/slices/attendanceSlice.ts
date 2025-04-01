import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';
import { Attendance, AttendanceFilters, attendanceService } from '../../services/attendanceService';

interface AttendanceState {
  attendanceRecords: Attendance[];
  currentRecord: Attendance | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  attendanceRecords: [],
  currentRecord: null,
  isLoading: false,
  error: null
};

// Async thunks that use direct Supabase services as fallback
export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (filters: AttendanceFilters | undefined = undefined, { rejectWithValue }) => {
    try {
      // Try API first
      const response = await apiClient.get('/attendance', { params: filters });
      return response.data.data;
    } catch (error: any) {
      console.log('API error, falling back to direct service:', error);
      try {
        // Fallback to direct service
        return await attendanceService.getAttendance(filters);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch attendance records');
      }
    }
  }
);

export const fetchAttendanceByEmployeeId = createAsyncThunk(
  'attendance/fetchAttendanceByEmployeeId',
  async (employeeId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/attendance/employee/${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      try {
        return await attendanceService.getAttendanceByEmployeeId(employeeId);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch employee attendance records');
      }
    }
  }
);

export const fetchAttendanceById = createAsyncThunk(
  'attendance/fetchAttendanceById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/attendance/${id}`);
      return response.data.data;
    } catch (error: any) {
      try {
        return await attendanceService.getAttendanceById(id);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to fetch attendance record');
      }
    }
  }
);

export const createAttendance = createAsyncThunk(
  'attendance/createAttendance',
  async (attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/attendance', attendanceData);
      return response.data.data;
    } catch (error: any) {
      try {
        return await attendanceService.createAttendance(attendanceData);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create attendance record');
      }
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'attendance/updateAttendance',
  async ({ id, data }: { id: number; data: Partial<Attendance> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/attendance/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      try {
        return await attendanceService.updateAttendance(id, data);
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to update attendance record');
      }
    }
  }
);

export const bulkCreateAttendance = createAsyncThunk(
  'attendance/bulkCreateAttendance',
  async (attendanceRecords: Array<Omit<Attendance, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/attendance/bulk', { records: attendanceRecords });
      return response.data.data;
    } catch (error: any) {
      try {
        const count = await attendanceService.bulkCreateAttendance(attendanceRecords);
        return { count };
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to create attendance records in bulk');
      }
    }
  }
);

export const deleteAttendance = createAsyncThunk(
  'attendance/deleteAttendance',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/attendance/${id}`);
      return id;
    } catch (error: any) {
      try {
        await attendanceService.deleteAttendance(id);
        return id;
      } catch (serviceError: any) {
        return rejectWithValue(serviceError.message || 'Failed to delete attendance record');
      }
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
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
      // Fetch all attendance records
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch attendance by employee ID
      .addCase(fetchAttendanceByEmployeeId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceByEmployeeId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload;
      })
      .addCase(fetchAttendanceByEmployeeId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single attendance record
      .addCase(fetchAttendanceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecord = action.payload;
      })
      .addCase(fetchAttendanceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create attendance record
      .addCase(createAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords.unshift(action.payload);
        state.currentRecord = action.payload;
      })
      .addCase(createAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update attendance record
      .addCase(updateAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.attendanceRecords.findIndex(record => record.id === action.payload.id);
        if (index !== -1) {
          state.attendanceRecords[index] = action.payload;
        }
        state.currentRecord = action.payload;
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Bulk create attendance records
      .addCase(bulkCreateAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkCreateAttendance.fulfilled, (state) => {
        state.isLoading = false;
        // Note: we don't update state here because we'd need to fetch the records again 
        // to get the IDs and full data
      })
      .addCase(bulkCreateAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete attendance record
      .addCase(deleteAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = state.attendanceRecords.filter(record => record.id !== action.payload);
        if (state.currentRecord && state.currentRecord.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentRecord, clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;