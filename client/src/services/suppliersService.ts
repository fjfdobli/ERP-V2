import { supabase } from '../supabaseClient';

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
  createdAt?: string;
  updatedAt?: string;
}

export type InsertSupplier = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupplier = Partial<InsertSupplier>;

// Helper function to normalize the data from the database to our Supplier interface
const normalizeSupplierData = (data: any): Supplier => {
  // Map status to Active/Inactive
  let status = data.status || 'Active';
  if (status !== 'Inactive' && status !== 'Active') {
    status = status === 'Regular' || status === 'New' ? 'Active' : 'Inactive';
  }
  
  // The database column is "contactPerson" with capital P per the schema
  const contactPerson = data.contactPerson || '';
  
  // Extract additional fields from notes
  let notes = data.notes || '';
  let businessType = 'Company';
  let taxId = '';
  let industry = '';
  let relationship_since = null;
  let alternatePhone = '';
  let billingAddressSame = true;
  let billingAddress = null;
  let paymentTerms = '30 Days Term';
  let productCategories = '';
  let leadTime = 7;
  let taxExempt = false;
  
  // Extract fields from notes using regex
  const businessTypeMatch = notes.match(/Business Type: ([^\n]+)/);
  if (businessTypeMatch && businessTypeMatch[1]) {
    businessType = businessTypeMatch[1];
  }
  
  const taxIdMatch = notes.match(/Tax ID: ([^\n]+)/);
  if (taxIdMatch && taxIdMatch[1]) {
    taxId = taxIdMatch[1];
  }
  
  const industryMatch = notes.match(/Industry: ([^\n]+)/);
  if (industryMatch && industryMatch[1]) {
    industry = industryMatch[1];
  }
  
  const relationshipMatch = notes.match(/Relationship Since: ([^\n]+)/);
  if (relationshipMatch && relationshipMatch[1] && relationshipMatch[1] !== 'Invalid Date') {
    relationship_since = relationshipMatch[1];
  }
  
  const alternatePhoneMatch = notes.match(/Alternate Phone: ([^\n]+)/);
  if (alternatePhoneMatch && alternatePhoneMatch[1]) {
    alternatePhone = alternatePhoneMatch[1];
  }
  
  const billingAddressSameMatch = notes.match(/Billing Address Same: ([^\n]+)/);
  if (billingAddressSameMatch && billingAddressSameMatch[1]) {
    billingAddressSame = billingAddressSameMatch[1] === 'Yes';
  }
  
  const billingAddressMatch = notes.match(/Billing Address: ([^\n]+)/);
  if (billingAddressMatch && billingAddressMatch[1]) {
    billingAddress = billingAddressMatch[1];
  }
  
  const paymentTermsMatch = notes.match(/Payment Terms: ([^\n]+)/);
  if (paymentTermsMatch && paymentTermsMatch[1]) {
    paymentTerms = paymentTermsMatch[1];
  }
  
  const productCategoriesMatch = notes.match(/Product Categories: ([^\n]+)/);
  if (productCategoriesMatch && productCategoriesMatch[1]) {
    productCategories = productCategoriesMatch[1];
  }
  
  const leadTimeMatch = notes.match(/Lead Time: (\d+)/);
  if (leadTimeMatch && leadTimeMatch[1]) {
    leadTime = parseInt(leadTimeMatch[1], 10);
  }
  
  const taxExemptMatch = notes.match(/Tax Exempt: ([^\n]+)/);
  if (taxExemptMatch && taxExemptMatch[1]) {
    taxExempt = taxExemptMatch[1] === 'Yes';
  }
  
  // Clean up notes by removing extracted fields
  const fieldsToRemove = [
    /Business Type: [^\n]+\n?/,
    /Tax ID: [^\n]+\n?/,
    /Industry: [^\n]+\n?/,
    /Relationship Since: [^\n]+\n?/,
    /Alternate Phone: [^\n]+\n?/,
    /Billing Address Same: [^\n]+\n?/,
    /Billing Address: [^\n]+\n?/,
    /Payment Terms: [^\n]+\n?/,
    /Product Categories: [^\n]+\n?/,
    /Lead Time: [^\n]+\n?/,
    /Tax Exempt: [^\n]+\n?/
  ];
  
  fieldsToRemove.forEach(pattern => {
    notes = notes.replace(pattern, '');
  });
  
  // Clean up any extra newlines
  notes = notes.replace(/\n{3,}/g, '\n\n').trim();
  
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
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
};

// Modified function to handle all fields safely and avoid field name mismatches
const prepareSupplierDataForDb = (supplier: InsertSupplier | UpdateSupplier) => {
  // First, create a base object with only fields we know exist in the database
  // IMPORTANT: Use the exact field names that exist in the Supabase database
  const dbData: any = {
    name: supplier.name || '',
    contactPerson: supplier.contactPerson || 'Unknown', // Using capital P as in the database schema
    email: supplier.email || '',
    phone: supplier.phone || '',
    status: supplier.status === 'Inactive' ? 'Inactive' : 'Active'
  };
  
  // Add optional fields if provided - only those that exist in the schema
  if (supplier.address !== undefined) dbData.address = supplier.address;
  
  // These fields don't exist in the schema directly - add them to notes
  let additionalNotes = '';
  
  if (supplier.businessType) additionalNotes += `Business Type: ${supplier.businessType}\n`;
  if (supplier.taxId) additionalNotes += `Tax ID: ${supplier.taxId}\n`;
  if (supplier.industry) additionalNotes += `Industry: ${supplier.industry}\n`;
  if (supplier.relationship_since && supplier.relationship_since !== 'Invalid Date') {
    additionalNotes += `Relationship Since: ${supplier.relationship_since}\n`;
  }
  if (supplier.alternatePhone) additionalNotes += `Alternate Phone: ${supplier.alternatePhone}\n`;
  if (supplier.billingAddressSame !== undefined) {
    additionalNotes += `Billing Address Same: ${supplier.billingAddressSame ? 'Yes' : 'No'}\n`;
  }
  if (supplier.billingAddress) additionalNotes += `Billing Address: ${supplier.billingAddress}\n`;
  if (supplier.paymentTerms) additionalNotes += `Payment Terms: ${supplier.paymentTerms}\n`;
  if (supplier.productCategories) additionalNotes += `Product Categories: ${supplier.productCategories}\n`;
  if (supplier.leadTime !== undefined) additionalNotes += `Lead Time: ${supplier.leadTime} days\n`;
  if (supplier.taxExempt !== undefined) additionalNotes += `Tax Exempt: ${supplier.taxExempt ? 'Yes' : 'No'}\n`;

  // Combine with existing notes if any
  let finalNotes = supplier.notes || '';
  if (additionalNotes) {
    finalNotes = finalNotes ? finalNotes + '\n\n' + additionalNotes : additionalNotes;
  }
  
  // Set the notes field
  if (finalNotes) {
    dbData.notes = finalNotes;
  }

  // IMPORTANT: Make sure we're not sending any fields that don't exist in the database
  // Explicitly delete any automatically added timestamp fields that could cause issues
  delete dbData.createdAt;
  delete dbData.updatedAt;
  
  console.log('Final prepared data for database:', dbData);
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
      
      // First verify the supplier exists
      const { data: existingSupplier, error: checkError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', numericId)
        .single();
        
      if (checkError || !existingSupplier) {
        console.error(`Supplier with id ${numericId} not found:`, checkError);
        throw new Error(`Supplier with id ${numericId} not found`);
      }
      
      // Convert supplier data to match database schema
      const supplierData = prepareSupplierDataForDb(supplier);
      console.log('Prepared data for database update:', supplierData);
      
      // We'll use a direct approach with explicit fields to avoid timing issues
      // Create a new object with only the fields we want to update
      // IMPORTANT: Use exact field names from the actual schema
      const updateData = {
        name: supplierData.name,
        contactPerson: supplierData.contactPerson,
        email: supplierData.email || '',
        phone: supplierData.phone || '',
        status: supplierData.status,
        address: supplierData.address || null,
        notes: supplierData.notes || null
      };
      
      console.log('Using explicit update object:', updateData);
      
      // Use direct UPDATE with select
      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', numericId)
        .select();
      
      if (error) {
        console.error(`Error updating supplier with id ${numericId}:`, error);
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        throw new Error(`Update failed for supplier with id ${numericId}`);
      }
      
      // Return the updated supplier
      return normalizeSupplierData(data[0]);
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
        .or(`name.ilike.${searchTerm},\"contactPerson\".ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
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

