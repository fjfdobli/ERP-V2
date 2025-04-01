import { supabase } from '../supabaseClient';

export interface Payroll {
  id: number;
  employeeId: number;
  employeeName?: string;  // Computed field for display
  period: string;  // YYYY-MM format for monthly payroll
  startDate: string;
  endDate: string;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  taxWithholding: number;
  netSalary: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid';
  notes: string | null;
  bankTransferRef: string | null;
  paymentDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  status?: string;
}

export type InsertPayroll = Omit<Payroll, 'id' | 'createdAt' | 'updatedAt' | 'employeeName'>;
export type UpdatePayroll = Partial<InsertPayroll>;

// Helper function to normalize data from the database
const normalizePayrollData = (data: any, employeeName?: string): Payroll => {
  return {
    id: data.id,
    employeeId: data.employeeId,
    employeeName: employeeName || undefined,
    period: data.period || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    baseSalary: data.baseSalary || 0,
    overtimePay: data.overtimePay || 0,
    bonus: data.bonus || 0,
    deductions: data.deductions || 0,
    taxWithholding: data.taxWithholding || 0,
    netSalary: data.netSalary || 0,
    status: data.status || 'Draft',
    notes: data.notes || null,
    bankTransferRef: data.bankTransferRef || null,
    paymentDate: data.paymentDate || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// Prepare data for database operations
const preparePayrollDataForDb = (payroll: InsertPayroll | UpdatePayroll) => {
  const dbData: any = {};
  
  if (payroll.employeeId !== undefined) dbData.employeeId = payroll.employeeId;
  if (payroll.period !== undefined) dbData.period = payroll.period;
  if (payroll.startDate !== undefined) dbData.startDate = payroll.startDate;
  if (payroll.endDate !== undefined) dbData.endDate = payroll.endDate;
  if (payroll.baseSalary !== undefined) dbData.baseSalary = payroll.baseSalary;
  if (payroll.overtimePay !== undefined) dbData.overtimePay = payroll.overtimePay;
  if (payroll.bonus !== undefined) dbData.bonus = payroll.bonus;
  if (payroll.deductions !== undefined) dbData.deductions = payroll.deductions;
  if (payroll.taxWithholding !== undefined) dbData.taxWithholding = payroll.taxWithholding;
  if (payroll.netSalary !== undefined) dbData.netSalary = payroll.netSalary;
  if (payroll.status !== undefined) dbData.status = payroll.status;
  if (payroll.notes !== undefined) dbData.notes = payroll.notes;
  if (payroll.bankTransferRef !== undefined) dbData.bankTransferRef = payroll.bankTransferRef;
  if (payroll.paymentDate !== undefined) dbData.paymentDate = payroll.paymentDate;
  
  return dbData;
};

export const payrollService = {
  async getPayrolls(filters?: PayrollFilters): Promise<Payroll[]> {
    try {
      console.log('Fetching payroll records with filters:', filters);
      
      let query = supabase
        .from('payroll')
        .select(`
          *,
          employees (
            id,
            firstName,
            lastName
          )
        `)
        .order('startDate', { ascending: false });
      
      // Apply filters if provided
      if (filters) {
        if (filters.period) {
          query = query.eq('period', filters.period);
        }
        if (filters.startDate) {
          query = query.gte('startDate', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('endDate', filters.endDate);
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
        console.error('Error fetching payroll records:', error);
        return []; 
      }
  
      if (!data || data.length === 0) {
        console.log('No payroll records found');
        return []; 
      }
      
      // Process data to include employee names
      return data.map(record => {
        const employee = record.employees;
        const employeeName = employee 
          ? `${employee.firstName} ${employee.lastName}`
          : 'Unknown Employee';
        
        return normalizePayrollData(record, employeeName);
      });
    } catch (error) {
      console.error('Unexpected error in getPayrolls:', error);
      return [];
    }
  },

  async getPayrollsByEmployeeId(employeeId: number): Promise<Payroll[]> {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .eq('employeeId', employeeId)
        .order('startDate', { ascending: false });

      if (error) {
        console.error(`Error fetching payroll for employee ${employeeId}:`, error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log(`No payroll records found for employee ${employeeId}`);
        return [];
      }

      return data.map(record => normalizePayrollData(record));
    } catch (error) {
      console.error('Unexpected error in getPayrollsByEmployeeId:', error);
      return [];
    }
  },

  async getPayrollById(id: number): Promise<Payroll> {
    try {
      const { data, error } = await supabase
        .from('payroll')
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
        console.error(`Error fetching payroll record with id ${id}:`, error);
        throw new Error(`Payroll record with ID ${id} not found`);
      }

      if (!data) {
        console.warn(`Payroll record with id ${id} not found`);
        throw new Error(`Payroll record with ID ${id} not found`);
      }

      const employee = data.employees;
      const employeeName = employee 
        ? `${employee.firstName} ${employee.lastName}`
        : 'Unknown Employee';

      return normalizePayrollData(data, employeeName);
    } catch (error) {
      console.error('Unexpected error in getPayrollById:', error);
      throw error;
    }
  },

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    try {
      console.log('Creating payroll record with data:', payroll);
      
      // Calculate net salary if not provided
      if (payroll.netSalary === undefined) {
        payroll.netSalary = 
          payroll.baseSalary + 
          payroll.overtimePay + 
          payroll.bonus - 
          payroll.deductions - 
          payroll.taxWithholding;
      }
      
      // Convert payroll data to match database schema
      const payrollData = preparePayrollDataForDb(payroll);
      
      const { data, error } = await supabase
        .from('payroll')
        .insert([payrollData])
        .select()
        .single();

      if (error) {
        console.error('Error creating payroll record:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create payroll record - no data returned');
      }

      return normalizePayrollData(data);
    } catch (error) {
      console.error('Unexpected error in createPayroll:', error);
      throw error;
    }
  },

  async updatePayroll(id: number, payroll: UpdatePayroll): Promise<Payroll> {
    try {
      console.log(`Updating payroll record ${id} with data:`, payroll);
      
      // Recalculate net salary if any component changed
      if (
        payroll.baseSalary !== undefined || 
        payroll.overtimePay !== undefined || 
        payroll.bonus !== undefined || 
        payroll.deductions !== undefined || 
        payroll.taxWithholding !== undefined
      ) {
        // Get current record
        const { data: currentPayroll } = await supabase
          .from('payroll')
          .select('*')
          .eq('id', id)
          .single();
          
        if (currentPayroll) {
          const baseSalary = payroll.baseSalary !== undefined ? payroll.baseSalary : currentPayroll.baseSalary;
          const overtimePay = payroll.overtimePay !== undefined ? payroll.overtimePay : currentPayroll.overtimePay;
          const bonus = payroll.bonus !== undefined ? payroll.bonus : currentPayroll.bonus;
          const deductions = payroll.deductions !== undefined ? payroll.deductions : currentPayroll.deductions;
          const taxWithholding = payroll.taxWithholding !== undefined ? payroll.taxWithholding : currentPayroll.taxWithholding;
          
          payroll.netSalary = baseSalary + overtimePay + bonus - deductions - taxWithholding;
        }
      }
      
      // Convert payroll data to match database schema
      const payrollData = preparePayrollDataForDb(payroll);
      
      const { data, error } = await supabase
        .from('payroll')
        .update(payrollData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating payroll record with id ${id}:`, error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error(`Update failed for payroll record with id ${id}`);
      }
      
      return normalizePayrollData(data);
    } catch (error) {
      console.error('Unexpected error in updatePayroll:', error);
      throw error;
    }
  },

  async bulkCreatePayroll(payrollRecords: InsertPayroll[]): Promise<number> {
    try {
      console.log('Creating multiple payroll records:', payrollRecords.length);
      
      // Calculate net salary for any records missing it
      const processedRecords = payrollRecords.map(record => {
        if (record.netSalary === undefined) {
          record.netSalary = 
            record.baseSalary + 
            record.overtimePay + 
            record.bonus - 
            record.deductions - 
            record.taxWithholding;
        }
        return record;
      });
      
      // Convert all records
      const formattedRecords = processedRecords.map(record => preparePayrollDataForDb(record));
      
      const { data, error } = await supabase
        .from('payroll')
        .insert(formattedRecords);

      if (error) {
        console.error('Error creating payroll records:', error);
        throw new Error(error.message);
      }

      return payrollRecords.length;
    } catch (error) {
      console.error('Unexpected error in bulkCreatePayroll:', error);
      throw error;
    }
  },

  async deletePayroll(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting payroll record with id ${id}:`, error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Unexpected error in deletePayroll:', error);
      throw error;
    }
  }
};