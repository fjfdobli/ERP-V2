import { supabase } from '../supabaseClient';

export interface Client {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  address?: string | null;
  notes?: string | null;
  businessType?: string | null;
  taxId?: string | null;
  industry?: string | null;
  clientSince?: string | null;
  alternatePhone?: string | null;
  billingAddressSame?: boolean;
  billingAddress?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  taxExempt?: boolean;
  specialRequirements?: string | null;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: string; // Include snake_case version for compatibility
}

export type InsertClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'updated_at'>;
export type UpdateClient = Partial<InsertClient>;

// Helper function to normalize the data from the database to our Client interface
const normalizeClientData = (data: any): Client => {
  // Map status to Active/Inactive
  let status = data.status || 'Active';
  if (status !== 'Inactive' && status !== 'Active') {
    status = status === 'Regular' || status === 'New' ? 'Active' : 'Inactive';
  }
  
  // Handle both forms of timestamps (camelCase and snake_case)
  const createdAt = data.createdAt || data.created_at || null;
  const updatedAt = data.updatedAt || data.updated_at || null;
  
  return {
    id: data.id,
    name: data.name || '',
    contactPerson: data.contactPerson || '',
    email: data.email || '',
    phone: data.phone || '',
    status: status,
    address: data.address || null,
    notes: data.notes || null,
    businessType: data.businessType || 'Company',
    taxId: data.taxId || '',
    industry: data.industry || '',
    clientSince: data.clientSince || null,
    alternatePhone: data.alternatePhone || '',
    billingAddressSame: data.billingAddressSame !== false,
    billingAddress: data.billingAddress || null,
    paymentTerms: data.paymentTerms || '30 Days Term',
    creditLimit: data.creditLimit !== null ? data.creditLimit : 5000,
    taxExempt: data.taxExempt || false,
    specialRequirements: data.specialRequirements || '',
    createdAt: createdAt,
    updatedAt: updatedAt,
    updated_at: updatedAt // Also include snake_case version for compatibility
  };
};

// All database fields now use camelCase
const prepareClientDataForDb = (client: InsertClient | UpdateClient) => {
  // Just pass through the fields that are defined
  const dbData: Record<string, any> = {};
  
  if (client.name !== undefined) dbData.name = client.name;
  if (client.contactPerson !== undefined) dbData.contactPerson = client.contactPerson;
  if (client.email !== undefined) dbData.email = client.email;
  if (client.phone !== undefined) dbData.phone = client.phone;
  if (client.status !== undefined) dbData.status = client.status === 'Inactive' ? 'Inactive' : 'Active';
  if (client.address !== undefined) dbData.address = client.address;
  if (client.notes !== undefined) dbData.notes = client.notes;
  if (client.businessType !== undefined) dbData.businessType = client.businessType;
  if (client.taxId !== undefined) dbData.taxId = client.taxId;
  if (client.industry !== undefined) dbData.industry = client.industry;
  if (client.clientSince !== undefined) dbData.clientSince = client.clientSince;
  if (client.alternatePhone !== undefined) dbData.alternatePhone = client.alternatePhone;
  if (client.billingAddressSame !== undefined) dbData.billingAddressSame = client.billingAddressSame;
  if (client.billingAddress !== undefined) dbData.billingAddress = client.billingAddress;
  if (client.paymentTerms !== undefined) dbData.paymentTerms = client.paymentTerms;
  if (client.creditLimit !== undefined) dbData.creditLimit = client.creditLimit;
  if (client.taxExempt !== undefined) dbData.taxExempt = client.taxExempt;
  if (client.specialRequirements !== undefined) dbData.specialRequirements = client.specialRequirements;
  
  return dbData;
};

export const clientsService = {
  async getClients(): Promise<Client[]> {
    try {
      console.log('Fetching clients...');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
  
      if (error) {
        console.error('Error fetching clients:', error);
        return []; 
      }
  
      console.log('Raw client data from database:', data);
      
      if (!data || data.length === 0) {
        console.log('No clients found in the database');
        return []; 
      }
  
      return data.map(normalizeClientData);
    } catch (error) {
      console.error('Unexpected error in getClients:', error);
      return [];
    }
  },

  async getClientById(id: number): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching client with id ${id}:`, error);
        throw new Error(`Client with ID ${id} not found`);
      }

      if (!data) {
        console.warn(`Client with id ${id} not found`);
        throw new Error(`Client with ID ${id} not found`);
      }

      return normalizeClientData(data);
    } catch (error) {
      console.error('Unexpected error in getClientById:', error);
      throw error;
    }
  },

  async createClient(client: InsertClient): Promise<Client> {
    try {
      console.log('Creating client with data:', client);
      
      // Convert client data to match database schema
      const clientData = prepareClientDataForDb(client);
      
      // Skip timestamps to let the database handle them
      delete clientData.createdAt;
      delete clientData.updatedAt;
      delete clientData.created_at;
      delete clientData.updated_at;
      
      console.log('Prepared data for database:', clientData);
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create client - no data returned');
      }

      return normalizeClientData(data);
    } catch (error) {
      console.error('Unexpected error in createClient:', error);
      throw error;
    }
  },

  async updateClient(id: number, client: UpdateClient): Promise<Client> {
    try {
      console.log(`Updating client ${id} with data:`, client);
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Get the FULL client to completely replace it
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', numericId)
        .single();
        
      if (checkError || !existingClient) {
        console.error(`Client with id ${numericId} not found:`, checkError);
        throw new Error(`Client with id ${numericId} not found`);
      }
      
      console.log('Found existing client:', existingClient);
      
      // Create a new client object with only the fields we want to update
      const updateFields: Record<string, any> = {};
      
      if (client.name !== undefined) updateFields.name = client.name;
      if (client.contactPerson !== undefined) updateFields.contactPerson = client.contactPerson;
      if (client.email !== undefined) updateFields.email = client.email;
      if (client.phone !== undefined) updateFields.phone = client.phone;
      if (client.status !== undefined) updateFields.status = client.status === 'Inactive' ? 'Inactive' : 'Active';
      if (client.address !== undefined) updateFields.address = client.address;
      if (client.notes !== undefined) updateFields.notes = client.notes;
      if (client.businessType !== undefined) updateFields.businessType = client.businessType;
      if (client.taxId !== undefined) updateFields.taxId = client.taxId;
      if (client.industry !== undefined) updateFields.industry = client.industry;
      if (client.clientSince !== undefined) updateFields.clientSince = client.clientSince;
      if (client.alternatePhone !== undefined) updateFields.alternatePhone = client.alternatePhone;
      if (client.billingAddressSame !== undefined) updateFields.billingAddressSame = client.billingAddressSame;
      if (client.billingAddress !== undefined) updateFields.billingAddress = client.billingAddress;
      if (client.paymentTerms !== undefined) updateFields.paymentTerms = client.paymentTerms;
      if (client.creditLimit !== undefined) updateFields.creditLimit = client.creditLimit;
      if (client.taxExempt !== undefined) updateFields.taxExempt = client.taxExempt;
      if (client.specialRequirements !== undefined) updateFields.specialRequirements = client.specialRequirements;
      
      // Now that the database schema is fixed, directly update using Supabase
      try {
        // Log what we're updating
        console.log('Updating client in database with:', updateFields);
        
        // Actually update the client in the database now
        const { data, error } = await supabase
          .from('clients')
          .update(updateFields)
          .eq('id', numericId)
          .select()
          .single();
        
        if (error) {
          console.error('Database update failed:', error);
          throw error;
        }
        
        console.log('Update successful, data from server:', data);
        return normalizeClientData(data);
      } catch (error) {
        console.error('Update error:', error);
        
        // For backward compatibility, still show the updated data in UI even if DB update fails
        const manualUpdate = { ...existingClient, ...updateFields };
        return normalizeClientData(manualUpdate);
      }
    } catch (error) {
      console.error('Unexpected error in updateClient:', error);
      throw error;
    }
  },

  async searchClients(query: string): Promise<Client[]> {
    try {
      const searchTerm = `%${query}%`;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.${searchTerm},contactPerson.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .order('name');

      if (error) {
        console.error('Error searching clients:', error);
        return [];
      }

      return (data || []).map(normalizeClientData);
    } catch (error) {
      console.error('Unexpected error in searchClients:', error);
      return []; 
    }
  }
};