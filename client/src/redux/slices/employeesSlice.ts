import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position: string;
  department?: string;
  baseSalary: number;
  joiningDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  attendanceDate: string;
  morningPresent: boolean;
  afternoonPresent: boolean;
  morningIn?: string;
  morningOut?: string;
  afternoonIn?: string;
  afternoonOut?: string;
  status: string;
  notes?: string;
}

interface EmployeesState {
  employees: Employee[];
  currentEmployee: Employee | null;
  attendanceRecords: Attendance[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  employees: [],
  currentEmployee: null,
  attendanceRecords: [],
  isLoading: false,
  error: null
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/employees');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchEmployeeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employee');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (employeeData: Partial<Employee>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/employees', employeeData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, data }: { id: string; data: Partial<Employee> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/employees/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update employee');
    }
  }
);

export const fetchEmployeeAttendance = createAsyncThunk(
  'employees/fetchEmployeeAttendance',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/attendance?employeeId=${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch attendance records');
    }
  }
);

export const recordAttendance = createAsyncThunk(
  'employees/recordAttendance',
  async (attendanceData: Partial<Attendance>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/attendance', attendanceData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to record attendance');
    }
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearCurrentEmployee: (state) => {
      state.currentEmployee = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchEmployeeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.employees.findIndex(employee => employee.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
        state.currentEmployee = action.payload;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchEmployeeAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload;
      })
      .addCase(fetchEmployeeAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(recordAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recordAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords.push(action.payload);
      })
      .addCase(recordAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentEmployee, clearError } = employeesSlice.actions;
export default employeesSlice.reducer;