import { supabase } from '../supabaseClient';

export interface Machinery {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  status: 'Operational' | 'Maintenance' | 'Repair' | 'Offline' | 'Retired';
  location: string | null;
  specifications: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineryFilters {
  type?: string;
  status?: string;
  manufacturer?: string;
}

export interface MaintenanceRecord {
  id: number;
  machineryId: number;
  date: string;
  type: 'Scheduled' | 'Repair' | 'Inspection' | 'Emergency';
  description: string;
  cost: number;
  performedBy: string;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type InsertMachinery = Omit<Machinery, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMachinery = Partial<InsertMachinery>;

export type InsertMaintenanceRecord = Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMaintenanceRecord = Partial<InsertMaintenanceRecord>;

// Helper function to normalize machinery data
const normalizeMachineryData = (data: any): Machinery => {
  return {
    id: data.id,
    name: data.name || '',
    type: data.type || '',
    model: data.model || '',
    serialNumber: data.serialNumber || '',
    manufacturer: data.manufacturer || '',
    purchaseDate: data.purchaseDate || null,
    purchasePrice: data.purchasePrice || null,
    lastMaintenanceDate: data.lastMaintenanceDate || null,
    nextMaintenanceDate: data.nextMaintenanceDate || null,
    status: data.status || 'Operational',
    location: data.location || null,
    specifications: data.specifications || null,
    notes: data.notes || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// Helper function to normalize maintenance record data
const normalizeMaintenanceData = (data: any): MaintenanceRecord => {
  return {
    id: data.id,
    machineryId: data.machineryId,
    date: data.date || '',
    type: data.type || 'Scheduled',
    description: data.description || '',
    cost: data.cost || 0,
    performedBy: data.performedBy || '',
    notes: data.notes || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// Prepare machinery data for database operations
const prepareMachineryDataForDb = (machinery: InsertMachinery | UpdateMachinery) => {
  const dbData: any = {};
  
  if (machinery.name !== undefined) dbData.name = machinery.name;
  if (machinery.type !== undefined) dbData.type = machinery.type;
  if (machinery.model !== undefined) dbData.model = machinery.model;
  if (machinery.serialNumber !== undefined) dbData.serialNumber = machinery.serialNumber;
  if (machinery.manufacturer !== undefined) dbData.manufacturer = machinery.manufacturer;
  if (machinery.purchaseDate !== undefined) dbData.purchaseDate = machinery.purchaseDate;
  if (machinery.purchasePrice !== undefined) dbData.purchasePrice = machinery.purchasePrice;
  if (machinery.lastMaintenanceDate !== undefined) dbData.lastMaintenanceDate = machinery.lastMaintenanceDate;
  if (machinery.nextMaintenanceDate !== undefined) dbData.nextMaintenanceDate = machinery.nextMaintenanceDate;
  if (machinery.status !== undefined) dbData.status = machinery.status;
  if (machinery.location !== undefined) dbData.location = machinery.location;
  if (machinery.specifications !== undefined) dbData.specifications = machinery.specifications;
  if (machinery.notes !== undefined) dbData.notes = machinery.notes;
  
  return dbData;
};

// Prepare maintenance record data for database operations
const prepareMaintenanceDataForDb = (record: InsertMaintenanceRecord | UpdateMaintenanceRecord) => {
  const dbData: any = {};
  
  if (record.machineryId !== undefined) dbData.machineryId = record.machineryId;
  if (record.date !== undefined) dbData.date = record.date;
  if (record.type !== undefined) dbData.type = record.type;
  if (record.description !== undefined) dbData.description = record.description;
  if (record.cost !== undefined) dbData.cost = record.cost;
  if (record.performedBy !== undefined) dbData.performedBy = record.performedBy;
  if (record.notes !== undefined) dbData.notes = record.notes;
  
  return dbData;
};

export const machineryService = {
  // Machinery CRUD operations
  async getMachinery(filters?: MachineryFilters): Promise<Machinery[]> {
    try {
      let query = supabase
        .from('machinery')
        .select('*')
        .order('name');
      
      // Apply filters if provided
      if (filters) {
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.manufacturer) {
          query = query.eq('manufacturer', filters.manufacturer);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching machinery:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(normalizeMachineryData);
    } catch (error) {
      console.error('Unexpected error in getMachinery:', error);
      return [];
    }
  },
  
  async getMachineryById(id: number): Promise<Machinery> {
    try {
      const { data, error } = await supabase
        .from('machinery')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching machinery with id ${id}:`, error);
        throw new Error(`Machinery with ID ${id} not found`);
      }
      
      if (!data) {
        throw new Error(`Machinery with ID ${id} not found`);
      }
      
      return normalizeMachineryData(data);
    } catch (error) {
      console.error('Unexpected error in getMachineryById:', error);
      throw error;
    }
  },
  
  async createMachinery(machinery: InsertMachinery): Promise<Machinery> {
    try {
      const machineryData = prepareMachineryDataForDb(machinery);
      
      const { data, error } = await supabase
        .from('machinery')
        .insert([machineryData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating machinery:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to create machinery - no data returned');
      }
      
      return normalizeMachineryData(data);
    } catch (error) {
      console.error('Unexpected error in createMachinery:', error);
      throw error;
    }
  },
  
  async updateMachinery(id: number, machinery: UpdateMachinery): Promise<Machinery> {
    try {
      const machineryData = prepareMachineryDataForDb(machinery);
      
      const { data, error } = await supabase
        .from('machinery')
        .update(machineryData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating machinery with id ${id}:`, error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error(`Update failed for machinery with id ${id}`);
      }
      
      return normalizeMachineryData(data);
    } catch (error) {
      console.error('Unexpected error in updateMachinery:', error);
      throw error;
    }
  },
  
  async deleteMachinery(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('machinery')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting machinery with id ${id}:`, error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Unexpected error in deleteMachinery:', error);
      throw error;
    }
  },
  
  // Maintenance record operations
  async getMaintenanceRecords(machineryId?: number): Promise<MaintenanceRecord[]> {
    try {
      let query = supabase
        .from('maintenance_records')
        .select('*')
        .order('date', { ascending: false });
      
      if (machineryId) {
        query = query.eq('machineryId', machineryId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching maintenance records:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(normalizeMaintenanceData);
    } catch (error) {
      console.error('Unexpected error in getMaintenanceRecords:', error);
      return [];
    }
  },
  
  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    try {
      const recordData = prepareMaintenanceDataForDb(record);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([recordData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating maintenance record:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to create maintenance record - no data returned');
      }
      
      // After creating a maintenance record, update the machinery's last maintenance date
      await this.updateMachinery(record.machineryId, {
        lastMaintenanceDate: record.date
      });
      
      return normalizeMaintenanceData(data);
    } catch (error) {
      console.error('Unexpected error in createMaintenanceRecord:', error);
      throw error;
    }
  },
  
  async updateMaintenanceRecord(id: number, record: UpdateMaintenanceRecord): Promise<MaintenanceRecord> {
    try {
      const recordData = prepareMaintenanceDataForDb(record);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating maintenance record with id ${id}:`, error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error(`Update failed for maintenance record with id ${id}`);
      }
      
      return normalizeMaintenanceData(data);
    } catch (error) {
      console.error('Unexpected error in updateMaintenanceRecord:', error);
      throw error;
    }
  },
  
  async deleteMaintenanceRecord(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error deleting maintenance record with id ${id}:`, error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Unexpected error in deleteMaintenanceRecord:', error);
      throw error;
    }
  },
  
  // Stats and summary operations
  async getMachineryStats(): Promise<any> {
    try {
      const { data: machinery, error: machineryError } = await supabase
        .from('machinery')
        .select('*');
      
      if (machineryError) {
        console.error('Error fetching machinery for stats:', machineryError);
        return {
          total: 0,
          operational: 0,
          maintenance: 0,
          repair: 0,
          offline: 0,
          retired: 0,
          maintenanceDue: 0
        };
      }
      
      if (!machinery || machinery.length === 0) {
        return {
          total: 0,
          operational: 0,
          maintenance: 0,
          repair: 0,
          offline: 0,
          retired: 0,
          maintenanceDue: 0
        };
      }
      
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      
      const stats = {
        total: machinery.length,
        operational: machinery.filter(m => m.status === 'Operational').length,
        maintenance: machinery.filter(m => m.status === 'Maintenance').length,
        repair: machinery.filter(m => m.status === 'Repair').length,
        offline: machinery.filter(m => m.status === 'Offline').length,
        retired: machinery.filter(m => m.status === 'Retired').length,
        maintenanceDue: machinery.filter(m => {
          if (!m.nextMaintenanceDate) return false;
          const nextDate = new Date(m.nextMaintenanceDate);
          return nextDate <= nextMonth && m.status !== 'Retired';
        }).length
      };
      
      return stats;
    } catch (error) {
      console.error('Unexpected error in getMachineryStats:', error);
      return {
        total: 0,
        operational: 0,
        maintenance: 0,
        repair: 0,
        offline: 0,
        retired: 0,
        maintenanceDue: 0
      };
    }
  },
  
  async getMaintenanceCostSummary(): Promise<any> {
    try {
      const { data: records, error } = await supabase
        .from('maintenance_records')
        .select('*');
      
      if (error) {
        console.error('Error fetching maintenance records for cost summary:', error);
        return {
          total: 0,
          byType: {},
          byMachinery: {}
        };
      }
      
      if (!records || records.length === 0) {
        return {
          total: 0,
          byType: {},
          byMachinery: {}
        };
      }
      
      // Calculate total cost
      const totalCost = records.reduce((sum, record) => sum + (record.cost || 0), 0);
      
      // Calculate cost by maintenance type
      const costByType: {[key: string]: number} = {};
      records.forEach(record => {
        const type = record.type || 'Unknown';
        costByType[type] = (costByType[type] || 0) + (record.cost || 0);
      });
      
      // Calculate cost by machinery
      const costByMachinery: {[key: number]: number} = {};
      records.forEach(record => {
        const machineryId = record.machineryId;
        costByMachinery[machineryId] = (costByMachinery[machineryId] || 0) + (record.cost || 0);
      });
      
      return {
        total: totalCost,
        byType: costByType,
        byMachinery: costByMachinery
      };
    } catch (error) {
      console.error('Unexpected error in getMaintenanceCostSummary:', error);
      return {
        total: 0,
        byType: {},
        byMachinery: {}
      };
    }
  }
};