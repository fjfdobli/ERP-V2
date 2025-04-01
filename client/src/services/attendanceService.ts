import { supabase } from '../supabaseClient';

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName?: string; // Computed field for display
  date: string; // ISO date format
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'On Leave';
  overtime: number | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  status?: string;
}

export type InsertAttendance = Omit<Attendance, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>;
export type UpdateAttendance = Partial<InsertAttendance>;

// Helper function to normalize data from the database
const normalizeAttendanceData = (data: any, employeeName?: string): Attendance => {
  return {
    id: data.id,
    employeeId: data.employeeId,
    employeeName: employeeName || undefined,
    date: data.date || null,
    timeIn: data.timeIn || null,
    timeOut: data.timeOut || null,
    status: data.status || 'Absent',
    overtime: data.overtime || 0,
    notes: data.notes || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// Prepare data for database operations
const prepareAttendanceDataForDb = (attendance: InsertAttendance | UpdateAttendance) => {
  const dbData: any = {};
  
  if (attendance.employeeId !== undefined) dbData.employeeId = attendance.employeeId;
  if (attendance.date !== undefined) dbData.date = attendance.date;
  if (attendance.timeIn !== undefined) dbData.timeIn = attendance.timeIn;
  if (attendance.timeOut !== undefined) dbData.timeOut = attendance.timeOut;
  if (attendance.status !== undefined) dbData.status = attendance.status;
  if (attendance.overtime !== undefined) dbData.overtime = attendance.overtime;
  if (attendance.notes !== undefined) dbData.notes = attendance.notes;
  
  return dbData;
};

export const attendanceService = {
  async getAttendance(filters?: AttendanceFilters): Promise<Attendance[]> {
    try {
      console.log('Fetching attendance records with filters:', filters);
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          employees (
            id,
            firstName,
            lastName
          )
        `)
        .order('date', { ascending: false });
      
      // Apply filters if provided
      if (filters) {
        if (filters.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('date', filters.endDate);
        }
        if (filters.employeeId) {
          query = query.eq('employeeId', filters.employeeId);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
      }
      
      const { data, error } = await query;
  
      if (error) {
        console.error('Error fetching attendance records:', error);
        return []; 
      }
  
      if (!data || data.length === 0) {
        console.log('No attendance records found');
        return []; 
      }
      
      // Process data to include employee names
      return data.map(record => {
        const employee = record.employees;
        const employeeName = employee 
          ? `${employee.firstName} ${employee.lastName}`
          : 'Unknown Employee';
        
        return normalizeAttendanceData(record, employeeName);
      });
    } catch (error) {
      console.error('Unexpected error in getAttendance:', error);
      return [];
    }
  },

  async getAttendanceByEmployeeId(employeeId: number): Promise<Attendance[]> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employeeId', employeeId)
        .order('date', { ascending: false });

      if (error) {
        console.error(`Error fetching attendance for employee ${employeeId}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log(`No attendance records found for employee ${employeeId}`);
        return [];
      }

      return data.map(record => normalizeAttendanceData(record));
    } catch (error) {
      console.error('Unexpected error in getAttendanceByEmployeeId:', error);
      return [];
    }
  },

  async getAttendanceById(id: number): Promise<Attendance> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (
            id,
            firstName,
            lastName
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching attendance record with id ${id}:`, error);
        throw new Error(`Attendance record with ID ${id} not found`);
      }

      if (!data) {
        console.warn(`Attendance record with id ${id} not found`);
        throw new Error(`Attendance record with ID ${id} not found`);
      }

      const employee = data.employees;
      const employeeName = employee 
        ? `${employee.firstName} ${employee.lastName}`
        : 'Unknown Employee';

      return normalizeAttendanceData(data, employeeName);
    } catch (error) {
      console.error('Unexpected error in getAttendanceById:', error);
      throw error;
    }
  },

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    try {
      console.log('Creating attendance record with data:', attendance);
      
      // Convert attendance data to match database schema
      const attendanceData = prepareAttendanceDataForDb(attendance);
      
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendanceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance record:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create attendance record - no data returned');
      }

      return normalizeAttendanceData(data);
    } catch (error) {
      console.error('Unexpected error in createAttendance:', error);
      throw error;
    }
  },

  async updateAttendance(id: number, attendance: UpdateAttendance): Promise<Attendance> {
    try {
      console.log(`Updating attendance record ${id} with data:`, attendance);
      
      // Convert attendance data to match database schema
      const attendanceData = prepareAttendanceDataForDb(attendance);
      
      const { data, error } = await supabase
        .from('attendance')
        .update(attendanceData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating attendance record with id ${id}:`, error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error(`Update failed for attendance record with id ${id}`);
      }
      
      return normalizeAttendanceData(data);
    } catch (error) {
      console.error('Unexpected error in updateAttendance:', error);
      throw error;
    }
  },

  async bulkCreateAttendance(attendanceRecords: InsertAttendance[]): Promise<number> {
    try {
      console.log('Creating multiple attendance records:', attendanceRecords.length);
      
      // Convert all records
      const formattedRecords = attendanceRecords.map(record => prepareAttendanceDataForDb(record));
      
      const { data, error } = await supabase
        .from('attendance')
        .insert(formattedRecords);

      if (error) {
        console.error('Error creating attendance records:', error);
        throw new Error(error.message);
      }

      return attendanceRecords.length;
    } catch (error) {
      console.error('Unexpected error in bulkCreateAttendance:', error);
      throw error;
    }
  },

  async deleteAttendance(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting attendance record with id ${id}:`, error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Unexpected error in deleteAttendance:', error);
      throw error;
    }
  }
};