import { supabase } from '../supabaseClient';
import { addMonths } from 'date-fns';

export interface Machinery {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  manufacturer: string | null;
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

export interface InsertMachinery {
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  manufacturer: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  status: string;
  location: string | null;
  specifications: string | null;
  notes: string | null;
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

export interface InsertMaintenanceRecord {
  machineryId: number;
  date: string;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
  notes: string | null;
}

export interface MachineryFilters {
  type?: string;
  status?: string;
  manufacturer?: string;
}

export interface MachineryStats {
  total: number;
  operational: number;
  maintenance: number;
  repair: number;
  offline: number;
  retired: number;
  maintenanceDue: number;
}

export interface MaintenanceCostSummary {
  totalCost: number;
  monthlyCosts: { month: string; cost: number }[];
  costByType: { type: string; cost: number }[];
}

const MACHINERY_TABLE = 'machinery';
const MAINTENANCE_RECORDS_TABLE = 'maintenance_records';

/**
 * Service for managing machinery and maintenance records in Supabase
 */
export const machineryService = {
  /**
   * Fetch all machinery with optional filters
   */
  async getMachinery(filters?: MachineryFilters): Promise<Machinery[]> {
    let query = supabase
      .from(MACHINERY_TABLE)
      .select('*')
      .order('name', { ascending: true });

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
      throw new Error(error.message);
    }

    return data as Machinery[];
  },

  /**
   * Fetch a single machinery by ID
   */
  async getMachineryById(id: number): Promise<Machinery | null> {
    const { data, error } = await supabase
      .from(MACHINERY_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching machinery with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data as Machinery;
  },

  /**
   * Create a new machinery
   */
  async createMachinery(machinery: InsertMachinery): Promise<Machinery> {
    const { data, error } = await supabase
      .from(MACHINERY_TABLE)
      .insert([machinery])
      .select()
      .single();

    if (error) {
      console.error('Error creating machinery:', error);
      throw new Error(error.message);
    }

    return data as Machinery;
  },

  /**
   * Update an existing machinery
   */
  async updateMachinery(id: number, machinery: Partial<InsertMachinery>): Promise<Machinery> {
    const { data, error } = await supabase
      .from(MACHINERY_TABLE)
      .update(machinery)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating machinery with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data as Machinery;
  },

  /**
   * Delete a machinery
   */
  async deleteMachinery(id: number): Promise<void> {
    const { error } = await supabase
      .from(MACHINERY_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting machinery with ID ${id}:`, error);
      throw new Error(error.message);
    }
  },

  /**
   * Fetch maintenance records for a specific machinery or all records
   */
  async getMaintenanceRecords(machineryId?: number): Promise<MaintenanceRecord[]> {
    let query = supabase
      .from(MAINTENANCE_RECORDS_TABLE)
      .select('*')
      .order('date', { ascending: false });

    if (machineryId) {
      query = query.eq('machineryId', machineryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching maintenance records:', error);
      throw new Error(error.message);
    }

    return data as MaintenanceRecord[];
  },

  /**
   * Create a new maintenance record
   */
  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from(MAINTENANCE_RECORDS_TABLE)
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating maintenance record:', error);
      throw new Error(error.message);
    }

    // Update the machinery's last maintenance date and set next maintenance date
    try {
      await supabase
        .from(MACHINERY_TABLE)
        .update({
          lastMaintenanceDate: record.date,
          // Set next maintenance date to 3 months from now by default
          nextMaintenanceDate: new Date(
            new Date(record.date).setMonth(new Date(record.date).getMonth() + 3)
          ).toISOString().split('T')[0]
        })
        .eq('id', record.machineryId);
    } catch (updateError) {
      console.error('Error updating machinery maintenance dates:', updateError);
      // Don't throw error here, as the maintenance record was created successfully
    }

    return data as MaintenanceRecord;
  },

  /**
   * Update an existing maintenance record
   */
  async updateMaintenanceRecord(id: number, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from(MAINTENANCE_RECORDS_TABLE)
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating maintenance record with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data as MaintenanceRecord;
  },

  /**
   * Delete a maintenance record
   */
  async deleteMaintenanceRecord(id: number): Promise<void> {
    const { error } = await supabase
      .from(MAINTENANCE_RECORDS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting maintenance record with ID ${id}:`, error);
      throw new Error(error.message);
    }
  },

  /**
   * Get machinery statistics
   */
  async getMachineryStats(): Promise<MachineryStats> {
    // Get all machinery to calculate stats
    const { data: machinery, error } = await supabase
      .from(MACHINERY_TABLE)
      .select('*');

    if (error) {
      console.error('Error fetching machinery for stats:', error);
      throw new Error(error.message);
    }

    // Calculate statistics
    const stats: MachineryStats = {
      total: machinery.length,
      operational: machinery.filter(m => m.status === 'Operational').length,
      maintenance: machinery.filter(m => m.status === 'Maintenance').length,
      repair: machinery.filter(m => m.status === 'Repair').length,
      offline: machinery.filter(m => m.status === 'Offline').length,
      retired: machinery.filter(m => m.status === 'Retired').length,
      maintenanceDue: 0
    };

    // Calculate machines due for maintenance (next maintenance date is in the past or within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    stats.maintenanceDue = machinery.filter(m => {
      if (!m.nextMaintenanceDate) return false;
      const nextDate = new Date(m.nextMaintenanceDate);
      return nextDate <= thirtyDaysFromNow && m.status !== 'Retired';
    }).length;

    return stats;
  },

  /**
   * Get maintenance cost summary
   */
  async getMaintenanceCostSummary(): Promise<MaintenanceCostSummary> {
    // Get all maintenance records to calculate costs
    const { data: records, error } = await supabase
      .from(MAINTENANCE_RECORDS_TABLE)
      .select('*');

    if (error) {
      console.error('Error fetching maintenance records for cost summary:', error);
      throw new Error(error.message);
    }

    // Calculate total cost
    const totalCost = records.reduce((sum, record) => sum + record.cost, 0);

    // Group costs by month
    const costByMonth = records.reduce((acc: Record<string, number>, record) => {
      const month = record.date.substring(0, 7); // YYYY-MM format
      acc[month] = (acc[month] || 0) + record.cost;
      return acc;
    }, {});

    // Convert to array and sort by month
    const monthlyCosts = Object.entries(costByMonth).map(([month, cost]) => ({
      month,
      cost
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Group costs by maintenance type
    const costByType = records.reduce((acc: Record<string, number>, record) => {
      acc[record.type] = (acc[record.type] || 0) + record.cost;
      return acc;
    }, {});

    // Convert to array
    const costByTypeArray = Object.entries(costByType).map(([type, cost]) => ({
      type,
      cost
    }));

    return {
      totalCost,
      monthlyCosts,
      costByType: costByTypeArray
    };
  }
};