import { supabase } from '../supabaseClient';

// Updated interface with number type for id
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
}

export type InsertClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClient = Partial<InsertClient>;

// Mock data for development
const mockClients: Client[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    contactPerson: 'John Doe',
    email: 'john@acme.com',
    phone: '123-456-7890',
    status: 'Regular',
    businessType: 'Company',
    industry: 'Manufacturing',
    creditLimit: 10000
  },
  {
    id: 2,
    name: 'Globex Industries',
    contactPerson: 'Jane Smith',
    email: 'jane@globex.com',
    phone: '987-654-3210',
    status: 'New',
    businessType: 'Company',
    industry: 'Technology',
    creditLimit: 15000
  }
];

export const clientsService = {
  async getClients(): Promise<Client[]> {
    try {
      console.log('Fetching clients...');
      
      // Try to fetch data from Supabase
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');
    
        if (error) {
          console.error('Error fetching clients:', error);
          return mockClients; // Return mock data on error
        }
    
        console.log('Raw client data from database:', data);
        
        if (!data || data.length === 0) {
          console.log('No clients found in the database');
          return mockClients; // Return mock data when empty
        }
    
        // Create normalized data with fallbacks for all fields
        const normalizedData = data.map(client => {
          console.log('Processing client:', client);
          return {
            id: client.id,
            name: client.name || '',
            contactPerson: client.contactPerson || client.contactperson || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status || 'Regular',
            address: client.address || null,
            notes: client.notes || null,
            businessType: client.businessType || client.business_type || 'Company',
            taxId: client.taxId || client.tax_id || '',
            industry: client.industry || '',
            clientSince: client.clientSince || client.client_since || null,
            alternatePhone: client.alternatePhone || client.alternate_phone || '',
            billingAddressSame: client.billingAddressSame || client.billing_address_same || true,
            billingAddress: client.billingAddress || client.billing_address || null,
            paymentTerms: client.paymentTerms || client.payment_terms || '30 Days Term',
            creditLimit: client.creditLimit || client.credit_limit || 5000,
            taxExempt: client.taxExempt || client.tax_exempt || false,
            specialRequirements: client.specialRequirements || client.special_requirements || '',
            createdAt: client.createdAt || client.created_at || '',
            updatedAt: client.updatedAt || client.updated_at || ''
          };
        });
    
        console.log('Normalized client data:', normalizedData);
        return normalizedData;
      } catch (fetchError) {
        console.error('Error accessing Supabase:', fetchError);
        return mockClients; // Return mock data on error
      }
    } catch (error) {
      console.error('Unexpected error in getClients:', error);
      return mockClients; // Return mock data on error
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
        // Return a mock client that matches the requested ID
        const mockClient = mockClients.find(c => c.id === id);
        if (mockClient) return mockClient;
        return mockClients[0]; // Fallback to first mock client
      }

      if (!data) {
        console.warn(`Client with id ${id} not found`);
        const mockClient = mockClients.find(c => c.id === id);
        if (mockClient) return mockClient;
        return mockClients[0]; // Fallback to first mock client
      }

      // Handle both camelCase and snake_case field names
      return {
        id: data.id,
        name: data.name,
        contactPerson: data.contactPerson || data.contactperson,
        email: data.email,
        phone: data.phone,
        status: data.status,
        address: data.address,
        notes: data.notes,
        businessType: data.businessType || data.business_type,
        taxId: data.taxId || data.tax_id,
        industry: data.industry,
        clientSince: data.clientSince || data.client_since,
        alternatePhone: data.alternatePhone || data.alternate_phone,
        billingAddressSame: data.billingAddressSame || data.billing_address_same,
        billingAddress: data.billingAddress || data.billing_address,
        paymentTerms: data.paymentTerms || data.payment_terms,
        creditLimit: data.creditLimit || data.credit_limit,
        taxExempt: data.taxExempt || data.tax_exempt,
        specialRequirements: data.specialRequirements || data.special_requirements,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at
      };
    } catch (error) {
      console.error('Unexpected error in getClientById:', error);
      // Return a mock client that matches the requested ID
      const mockClient = mockClients.find(c => c.id === id);
      if (mockClient) return mockClient;
      return mockClients[0]; // Fallback to first mock client
    }
  },

  async createClient(client: InsertClient): Promise<Client> {
    try {
      // Log the data being sent to ensure proper format
      console.log('Creating client with data:', client);
      
      // Map camelCase field names to match database columns
      const clientData = {
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        status: client.status,
        address: client.address,
        notes: client.notes,
        businessType: client.businessType,
        taxId: client.taxId,
        industry: client.industry,
        clientSince: client.clientSince,
        alternatePhone: client.alternatePhone,
        billingAddressSame: client.billingAddressSame,
        billingAddress: client.billingAddress,
        paymentTerms: client.paymentTerms,
        creditLimit: client.creditLimit,
        taxExempt: client.taxExempt,
        specialRequirements: client.specialRequirements
      };
      
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

      // Handle both camelCase and snake_case field names in the response
      return {
        id: data.id,
        name: data.name,
        contactPerson: data.contactPerson || data.contactperson,
        email: data.email,
        phone: data.phone,
        status: data.status,
        address: data.address,
        notes: data.notes,
        businessType: data.businessType || data.business_type,
        taxId: data.taxId || data.tax_id,
        industry: data.industry,
        clientSince: data.clientSince || data.client_since,
        alternatePhone: data.alternatePhone || data.alternate_phone,
        billingAddressSame: data.billingAddressSame || data.billing_address_same,
        billingAddress: data.billingAddress || data.billing_address,
        paymentTerms: data.paymentTerms || data.payment_terms,
        creditLimit: data.creditLimit || data.credit_limit,
        taxExempt: data.taxExempt || data.tax_exempt,
        specialRequirements: data.specialRequirements || data.special_requirements,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at
      };
    } catch (error) {
      console.error('Unexpected error in createClient:', error);
      throw error;
    }
  },

  async updateClient(id: number, client: UpdateClient): Promise<Client> {
    try {
      // Log the data being sent
      console.log(`Updating client ${id} with data:`, client);
      
      // Ensure id is a number
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // First, check if the client exists
      try {
        const { data: existingClient, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('id', numericId)
          .single();
          
        if (checkError || !existingClient) {
          console.error(`Client with id ${numericId} not found:`, checkError);
          throw new Error(`Client with id ${numericId} not found`);
        }
        
        // Now update the client
        const { data, error } = await supabase
          .from('clients')
          .update(client)
          .eq('id', numericId)
          .select();
  
        if (error) {
          console.error(`Error updating client with id ${numericId}:`, error);
          throw new Error(error.message);
        }
  
        if (!data || data.length === 0) {
          throw new Error(`Update failed for client with id ${numericId}`);
        }
  
        // Return the first (and should be only) item in the array
        const updatedClient = data[0];
        
        // Handle both camelCase and snake_case field names in the response
        return {
          id: updatedClient.id,
          name: updatedClient.name,
          contactPerson: updatedClient.contactPerson || updatedClient.contactperson,
          email: updatedClient.email,
          phone: updatedClient.phone,
          status: updatedClient.status,
          address: updatedClient.address,
          notes: updatedClient.notes,
          businessType: updatedClient.businessType || updatedClient.business_type,
          taxId: updatedClient.taxId || updatedClient.tax_id,
          industry: updatedClient.industry,
          clientSince: updatedClient.clientSince || updatedClient.client_since,
          alternatePhone: updatedClient.alternatePhone || updatedClient.alternate_phone,
          billingAddressSame: updatedClient.billingAddressSame || updatedClient.billing_address_same,
          billingAddress: updatedClient.billingAddress || updatedClient.billing_address,
          paymentTerms: updatedClient.paymentTerms || updatedClient.payment_terms,
          creditLimit: updatedClient.creditLimit || updatedClient.credit_limit,
          taxExempt: updatedClient.taxExempt || updatedClient.tax_exempt,
          specialRequirements: updatedClient.specialRequirements || updatedClient.special_requirements,
          createdAt: updatedClient.createdAt || updatedClient.created_at,
          updatedAt: updatedClient.updatedAt || updatedClient.updated_at
        };
      } catch (error) {
        // Return a mock client that matches the requested ID
        const mockClient = mockClients.find(c => c.id === id);
        if (mockClient) {
          // Update with new values
          const updatedMock = { ...mockClient, ...client };
          return updatedMock;
        }
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error in updateClient:', error);
      throw error;
    }
  },

  async searchClients(query: string): Promise<Client[]> {
    try {
      const searchTerm = `%${query}%`;
      
      try {
        // Search across multiple columns using ilike for case-insensitive search
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .or(`name.ilike.${searchTerm},contactPerson.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .order('name');
  
        if (error) {
          console.error('Error searching clients:', error);
          // Filter mock data
          return mockClients.filter(client => 
            client.name.toLowerCase().includes(query.toLowerCase()) ||
            client.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
            (client.phone && client.phone.toLowerCase().includes(query.toLowerCase()))
          );
        }
  
        // Handle both camelCase and snake_case field names
        const normalizedData = (data || []).map(client => ({
          id: client.id,
          name: client.name,
          contactPerson: client.contactPerson || client.contactperson,
          email: client.email,
          phone: client.phone,
          status: client.status,
          address: client.address,
          notes: client.notes,
          businessType: client.businessType || client.business_type,
          taxId: client.taxId || client.tax_id,
          industry: client.industry,
          clientSince: client.clientSince || client.client_since,
          alternatePhone: client.alternatePhone || client.alternate_phone,
          billingAddressSame: client.billingAddressSame || client.billing_address_same,
          billingAddress: client.billingAddress || client.billing_address,
          paymentTerms: client.paymentTerms || client.payment_terms,
          creditLimit: client.creditLimit || client.credit_limit,
          taxExempt: client.taxExempt || client.tax_exempt,
          specialRequirements: client.specialRequirements || client.special_requirements,
          createdAt: client.createdAt || client.created_at,
          updatedAt: client.updatedAt || client.updated_at
        }));
  
        return normalizedData;
      } catch (error) {
        console.error('Error searching in Supabase:', error);
        // Filter mock data
        return mockClients.filter(client => 
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
          (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
          (client.phone && client.phone.toLowerCase().includes(query.toLowerCase()))
        );
      }
    } catch (error) {
      console.error('Unexpected error in searchClients:', error);
      return mockClients; // Return all mock data on error
    }
  }
};