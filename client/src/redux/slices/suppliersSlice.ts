import { supabase } from '../../supabaseClient';

export interface Supplier {
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
  relationship_since?: string | null;
  alternatePhone?: string | null;
  billingAddressSame?: boolean;
  billingAddress?: string | null;
  paymentTerms?: string | null;
  productCategories?: string | null;
  leadTime?: number | null;
  taxExempt?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type InsertSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSupplier = Partial<InsertSupplier>;

// Helper function to normalize the data from the database to our Supplier interface
const normalizeSupplierData = (data: any): Supplier => {
  // Map status to Active/Inactive
  let status = data.status || 'Active';
  if (status !== 'Inactive' && status !== 'Active') {
    status = status === 'Regular' || status === 'New' ? 'Active' : 'Inactive';
  }
  
  // The database column is "contactperson" (all lowercase, confirmed from error)
  const contactPerson = data.contactperson || '';
  
  // Parse additional fields from JSON in notes
  let parsedNotes: any = {};
  let notes = '';
  
  try {
    if (data.notes && typeof data.notes === 'string') {
      // Try to parse as JSON first
      try {
        parsedNotes = JSON.parse(data.notes);
        console.log('Successfully parsed notes as JSON:', parsedNotes);
      } catch (e) {
        // If it's not valid JSON, just use it as plain text
        notes = data.notes;
        console.log('Notes is not JSON, using as plain text');
      }
    }
  } catch (e) {
    console.error('Error parsing notes:', e);
  }
  
  // Extract fields from parsed JSON or use defaults
  const originalNotes = parsedNotes.originalNotes || '';
  const businessType = parsedNotes.businessType || data.businessType || 'Company';
  const taxId = parsedNotes.taxId || data.taxId || '';
  const industry = parsedNotes.industry || data.industry || '';
  const relationship_since = parsedNotes.relationship_since || data.relationship_since || null;
  const alternatePhone = parsedNotes.alternatePhone || data.alternatePhone || '';
  const billingAddressSame = parsedNotes.billingAddressSame !== undefined ? parsedNotes.billingAddressSame : 
                            (data.billingAddressSame !== undefined ? data.billingAddressSame : true);
  const billingAddress = parsedNotes.billingAddress || data.billingAddress || null;
  const paymentTerms = parsedNotes.paymentTerms || data.paymentTerms || '30 Days Term';
  const productCategories = parsedNotes.productCategories || data.productCategories || '';
  const leadTime = parsedNotes.leadTime !== undefined ? parsedNotes.leadTime : 
                  (data.leadTime !== null && data.leadTime !== undefined ? data.leadTime : 7);
  const taxExempt = parsedNotes.taxExempt !== undefined ? parsedNotes.taxExempt : 
                   (data.taxExempt !== undefined ? data.taxExempt : false);
  
  // Use originalNotes if we parsed JSON, otherwise use the notes field directly
  notes = originalNotes || notes;
  
  return {
    id: data.id,
    name: data.name || '',
    contactPerson: contactPerson,
    email: data.email || '',
    phone: data.phone || '',
    status: status,
    address: data.address || null,
    notes: notes || null,
    businessType: businessType,
    taxId: taxId,
    industry: industry,
    relationship_since: relationship_since,
    alternatePhone: alternatePhone,
    billingAddressSame: billingAddressSame,
    billingAddress: billingAddress,
    paymentTerms: paymentTerms,
    productCategories: productCategories,
    leadTime: leadTime,
    taxExempt: taxExempt,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null
  };
};

// Now we know the exact field name: contactperson (lowercase)
const prepareSupplierDataForDb = (supplier: InsertSupplier | UpdateSupplier) => {
  // Use the required fields with the exact names from the database error
  const dbData: any = {
    name: supplier.name || 'Unnamed Supplier',
    contactperson: supplier.contactPerson || 'Unknown' // The DB requires this exact field name (lowercase)
  };
  
  // Store all fields in a JSON string in the notes field
  // This avoids any issue with column names
  const allFields: any = {
    // Core fields
    contactPerson: supplier.contactPerson || 'Unknown',
    email: supplier.email || '',
    phone: supplier.phone || '',
    status: supplier.status || 'Active',
    address: supplier.address || '',
    
    // Additional fields
    businessType: supplier.businessType || 'Company',
    taxId: supplier.taxId || '',
    industry: supplier.industry || '',
    relationship_since: supplier.relationship_since || null,
    alternatePhone: supplier.alternatePhone || '',
    billingAddressSame: supplier.billingAddressSame !== undefined ? supplier.billingAddressSame : true,
    billingAddress: supplier.billingAddress || null,
    paymentTerms: supplier.paymentTerms || '30 Days Term',
    leadTime: supplier.leadTime !== undefined ? supplier.leadTime : 7,
    productCategories: supplier.productCategories || '',
    taxExempt: supplier.taxExempt !== undefined ? supplier.taxExempt : false,
    
    // Original notes if any
    originalNotes: supplier.notes || ''
  };
  
  // Store ALL fields in notes to avoid any column name issues
  dbData.notes = JSON.stringify(allFields);
  
  // Remove timestamp fields that cause errors
  delete dbData.created_at;
  delete dbData.updated_at;
  
  return dbData;
};

export const suppliersService = {
  async getSuppliers(): Promise<Supplier[]> {
    try {
      console.log('Fetching suppliers...');
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
  
      if (error) {
        console.error('Error fetching suppliers:', error);
        return []; 
      }
  
      console.log('Raw supplier data from database:', data);
      
      if (!data || data.length === 0) {
        console.log('No suppliers found in the database');
        return []; 
      }
  
      return data.map(normalizeSupplierData);
    } catch (error) {
      console.error('Unexpected error in getSuppliers:', error);
      return [];
    }
  },

  async getSupplierById(id: number): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching supplier with id ${id}:`, error);
        throw new Error(`Supplier with ID ${id} not found`);
      }

      if (!data) {
        console.warn(`Supplier with id ${id} not found`);
        throw new Error(`Supplier with ID ${id} not found`);
      }

      return normalizeSupplierData(data);
    } catch (error) {
      console.error('Unexpected error in getSupplierById:', error);
      throw error;
    }
  },

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      console.log('Creating supplier with data:', supplier);
      
      // Convert supplier data to match database schema
      const supplierData = prepareSupplierDataForDb(supplier);
      console.log('Prepared data for database:', supplierData);
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create supplier - no data returned');
      }

      return normalizeSupplierData(data);
    } catch (error) {
      console.error('Unexpected error in createSupplier:', error);
      throw error;
    }
  },

  async updateSupplier(id: number, supplier: UpdateSupplier): Promise<Supplier> {
    try {
      console.log(`Updating supplier ${id} with data:`, supplier);
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // First verify the supplier exists and get the current data
      console.log(`Checking if supplier with ID ${numericId} exists...`);
      const { data: existingSupplier, error: checkError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', numericId)
        .single();
      
      console.log('Existing supplier data:', existingSupplier);
        
      if (checkError || !existingSupplier) {
        console.error(`Supplier with id ${numericId} not found:`, checkError);
        throw new Error(`Supplier with id ${numericId} not found`);
      }
      
      // This is a radical approach: Instead of updating, we'll delete and re-insert
      // This avoids any issues with update triggers and the updatedAt field
      console.log('Using delete + insert approach to avoid updatedAt error');
      
      // First, delete the existing supplier
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', numericId);
        
      if (deleteError) {
        console.error(`Error deleting supplier ${numericId}:`, deleteError);
        throw new Error(deleteError.message);
      }
      
      // Convert supplier data to match database schema
      const supplierData = prepareSupplierDataForDb(supplier);
      console.log('Prepared data for database re-insert:', supplierData);
      
      // Ensure we preserve the ID
      supplierData.id = numericId;
      
      // Now re-insert the supplier with the same ID
      const { data: insertedData, error: insertError } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();
        
      if (insertError) {
        console.error(`Error re-inserting supplier ${numericId}:`, insertError);
        
        // Emergency fallback: If re-insert fails, try to restore the original data
        console.log('Re-insert failed, attempting to restore original data');
        
        // Prepare the original data for re-insertion
        const originalData = {
          id: numericId,
          name: existingSupplier.name,
          contactperson: existingSupplier.contactperson,
          email: existingSupplier.email,
          phone: existingSupplier.phone,
          status: existingSupplier.status,
          address: existingSupplier.address,
          notes: existingSupplier.notes
        };
        
        const { error: restoreError } = await supabase
          .from('suppliers')
          .insert([originalData]);
          
        if (restoreError) {
          console.error(`Failed to restore original data for supplier ${numericId}:`, restoreError);
        } else {
          console.log(`Successfully restored original data for supplier ${numericId}`);
        }
        
        throw new Error(insertError.message);
      }
      
      if (!insertedData) {
        throw new Error(`Re-insert failed for supplier with id ${numericId} - no data returned`);
      }
      
      console.log('Successfully updated supplier using delete+insert approach:', insertedData);
      return normalizeSupplierData(insertedData);
    } catch (error) {
      console.error('Unexpected error in updateSupplier:', error);
      throw error;
    }
  },

  async searchSuppliers(query: string): Promise<Supplier[]> {
    try {
      const searchTerm = `%${query}%`;
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or(`name.ilike.${searchTerm},contactperson.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .order('name');

      if (error) {
        console.error('Error searching suppliers:', error);
        return [];
      }

      return (data || []).map(normalizeSupplierData);
    } catch (error) {
      console.error('Unexpected error in searchSuppliers:', error);
      return []; 
    }
  }
};