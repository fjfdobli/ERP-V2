import { supabase } from '../supabaseClient';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  hireDate?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  employeeId?: string | null;
  notes?: string | null;
  salary?: number | null;
  bankDetails?: string | null;
  taxId?: string | null;
  birthDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type InsertEmployee = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmployee = Partial<InsertEmployee>;

// Helper function to normalize the data from the database to our Employee interface
const normalizeEmployeeData = (data: any): Employee => {
  // Map status to Active/Inactive
  let status = data.status || 'Active';
  if (status !== 'Inactive' && status !== 'Active') {
    status = status === 'Regular' || status === 'New' ? 'Active' : 'Inactive';
  }
  
  return {
    id: data.id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    position: data.position || '',
    department: data.department || '',
    status: status,
    hireDate: data.hireDate || null,
    address: data.address || null,
    emergencyContact: data.emergencyContact || null,
    emergencyPhone: data.emergencyPhone || null,
    employeeId: data.employeeId || null,
    notes: data.notes || null,
    salary: data.salary || null,
    bankDetails: data.bankDetails || null,
    taxId: data.taxId || null,
    birthDate: data.birthDate || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// All database fields now use camelCase, so no conversion needed
const prepareEmployeeDataForDb = (employee: InsertEmployee | UpdateEmployee) => {
  // Just pass through the fields that are defined
  const dbData: any = {};
  
  if (employee.firstName !== undefined) dbData.firstName = employee.firstName;
  if (employee.lastName !== undefined) dbData.lastName = employee.lastName;
  if (employee.email !== undefined) dbData.email = employee.email;
  if (employee.phone !== undefined) dbData.phone = employee.phone;
  if (employee.position !== undefined) dbData.position = employee.position;
  if (employee.department !== undefined) dbData.department = employee.department;
  if (employee.status !== undefined) dbData.status = employee.status === 'Inactive' ? 'Inactive' : 'Active';
  if (employee.hireDate !== undefined) dbData.hireDate = employee.hireDate;
  if (employee.address !== undefined) dbData.address = employee.address;
  if (employee.emergencyContact !== undefined) dbData.emergencyContact = employee.emergencyContact;
  if (employee.emergencyPhone !== undefined) dbData.emergencyPhone = employee.emergencyPhone;
  if (employee.employeeId !== undefined) dbData.employeeId = employee.employeeId;
  if (employee.notes !== undefined) dbData.notes = employee.notes;
  if (employee.salary !== undefined) dbData.salary = employee.salary;
  if (employee.bankDetails !== undefined) dbData.bankDetails = employee.bankDetails;
  if (employee.taxId !== undefined) dbData.taxId = employee.taxId;
  if (employee.birthDate !== undefined) dbData.birthDate = employee.birthDate;
  
  return dbData;
};

export const employeesService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      console.log('Fetching employees...');
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('lastName');
  
      if (error) {
        console.error('Error fetching employees:', error);
        return []; 
      }
  
      console.log('Raw employee data from database:', data);
      
      if (!data || data.length === 0) {
        console.log('No employees found in the database');
        return []; 
      }
  
      return data.map(normalizeEmployeeData);
    } catch (error) {
      console.error('Unexpected error in getEmployees:', error);
      return [];
    }
  },

  async getEmployeeById(id: number): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching employee with id ${id}:`, error);
        throw new Error(`Employee with ID ${id} not found`);
      }

      if (!data) {
        console.warn(`Employee with id ${id} not found`);
        throw new Error(`Employee with ID ${id} not found`);
      }

      return normalizeEmployeeData(data);
    } catch (error) {
      console.error('Unexpected error in getEmployeeById:', error);
      throw error;
    }
  },

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    try {
      console.log('Creating employee with data:', employee);
      
      // Convert employee data to match database schema
      const employeeData = prepareEmployeeDataForDb(employee);
      console.log('Prepared data for database:', employeeData);
      
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create employee - no data returned');
      }

      return normalizeEmployeeData(data);
    } catch (error) {
      console.error('Unexpected error in createEmployee:', error);
      throw error;
    }
  },

  async updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee> {
    try {
      console.log(`Updating employee ${id} with data:`, employee);
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // First verify the employee exists
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', numericId)
        .single();
        
      if (checkError || !existingEmployee) {
        console.error(`Employee with id ${numericId} not found:`, checkError);
        throw new Error(`Employee with id ${numericId} not found`);
      }
      
      // Convert employee data to match database schema
      const employeeData = prepareEmployeeDataForDb(employee);
      console.log('Prepared data for database update:', employeeData);
      
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', numericId)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating employee with id ${numericId}:`, error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error(`Update failed for employee with id ${numericId}`);
      }
      
      return normalizeEmployeeData(data);
    } catch (error) {
      console.error('Unexpected error in updateEmployee:', error);
      throw error;
    }
  },

  async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const searchTerm = `%${query}%`;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or(`firstName.ilike.${searchTerm},lastName.ilike.${searchTerm},email.ilike.${searchTerm},position.ilike.${searchTerm}`)
        .order('lastName');

      if (error) {
        console.error('Error searching employees:', error);
        return [];
      }

      return (data || []).map(normalizeEmployeeData);
    } catch (error) {
      console.error('Unexpected error in searchEmployees:', error);
      return []; 
    }
  }
};