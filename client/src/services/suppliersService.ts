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
  
  // Try different variations of the contact person field name
  let contactPerson = '';
  if (data.contactPerson !== undefined) {
    contactPerson = data.contactPerson;
  } else if (data.contactperson !== undefined) {
    contactPerson = data.contactperson;
  } else if (data.contact_person !== undefined) {
    contactPerson = data.contact_person;
  }
  
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
  // We'll exclude the contact person field and add it dynamically later
  const dbData: any = {
    name: supplier.name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    status: supplier.status === 'Inactive' ? 'Inactive' : 'Active'
  };
  
  // We'll try both camelCase and lowercase versions of contactperson
  // Only one will actually make it to the database
  dbData.contactperson = supplier.contactPerson || 'Unknown';  // lowercase version
  
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
      
      // Log the available column names to understand the schema
      console.log('Available column names in existing supplier:', Object.keys(existingSupplier));
      
      // Convert supplier data to match database schema
      const supplierData = prepareSupplierDataForDb(supplier);
      console.log('Prepared data for database update:', supplierData);
      
      // WORKAROUND: We'll update one field at a time to avoid triggering issues with the updatedAt field
      console.log('Using field-by-field update to avoid triggering issues...');
      
      // First, update just the name (which should work)
      let nameUpdate = await supabase
        .from('suppliers')
        .update({ name: supplierData.name || 'Unnamed Supplier' })
        .eq('id', numericId);
        
      if (nameUpdate.error) {
        console.error('Name update failed:', nameUpdate.error);
        throw new Error(nameUpdate.error.message);
      }
      
      // Now try updating each remaining field one by one
      try {
        // Update contactperson field (trying lowercase first)
        await supabase
          .from('suppliers')
          .update({ contactperson: supplierData.contactperson })
          .eq('id', numericId);
      } catch (e) {
        console.log('contactperson update failed:', e);
        // Try with camelCase
        try {
          await supabase
            .from('suppliers')
            .update({ contactPerson: supplierData.contactperson })
            .eq('id', numericId);
        } catch (e2) {
          console.log('contactPerson update failed too:', e2);
        }
      }
      
      // Continue with other fields
      try {
        await supabase
          .from('suppliers')
          .update({ email: supplierData.email || '' })
          .eq('id', numericId);
      } catch (e) {
        console.log('email update failed:', e);
      }
      
      try {
        await supabase
          .from('suppliers')
          .update({ phone: supplierData.phone || '' })
          .eq('id', numericId);
      } catch (e) {
        console.log('phone update failed:', e);
      }
      
      try {
        await supabase
          .from('suppliers')
          .update({ status: supplierData.status || 'Active' })
          .eq('id', numericId);
      } catch (e) {
        console.log('status update failed:', e);
      }
      
      try {
        await supabase
          .from('suppliers')
          .update({ address: supplierData.address || null })
          .eq('id', numericId);
      } catch (e) {
        console.log('address update failed:', e);
      }
      
      try {
        await supabase
          .from('suppliers')
          .update({ notes: supplierData.notes || null })
          .eq('id', numericId);
      } catch (e) {
        console.log('notes update failed:', e);
      }
      
      // Finally, get the updated record
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', numericId)
        .single();
      
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
      
      // First, let's try with a simple 'name' search to avoid field name issues
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', searchTerm)
        .order('name');

      if (error) {
        console.error('Error searching suppliers by name:', error);
        return [];
      }

      return (data || []).map(normalizeSupplierData);
    } catch (error) {
      console.error('Unexpected error in searchSuppliers:', error);
      return []; 
    }
  }
};

