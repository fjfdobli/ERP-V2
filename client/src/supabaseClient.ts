import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyjfpkcxwljfkxbjagbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5amZwa2N4d2xqZmt4YmphZ2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2Njg5NzUsImV4cCI6MjA1ODI0NDk3NX0.0fJgoMe23ZPE1Rgz70RFwV31c3qRGnt1Cciz-x_F0io';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce', // More secure auth flow
    detectSessionInUrl: true, // Auto-detect auth redirects
    storage: localStorage,
    storageKey: 'opzons-auth-storage',
    debug: false // Set to true if you want to debug auth issues
  },
  // Removed custom headers that were causing CORS issues
  global: {
    headers: { }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Initialize and ensure the verification_codes table exists
export const initializeAuthTables = async () => {
  try {
    // Check if verification_codes table exists
    const { error: queryError } = await supabase
      .from('verification_codes')
      .select('id')
      .limit(1);
    
    // If there was an error, the table might not exist
    if (queryError && queryError.message.includes('does not exist')) {
      console.log('Creating verification_codes table...');
      
      // Create the verification_codes table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.verification_codes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR,
          phone VARCHAR,
          code VARCHAR NOT NULL,
          type VARCHAR NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL
        );
      `;
      
      // Try to execute the create table SQL (this requires PostgreSQL permissions)
      const { error: createError } = await supabase.rpc('pg_query', { query: createTableQuery });
      
      if (createError) {
        console.error('Error creating verification_codes table:', createError);
        console.log('Please run the SQL script from server/supabase/migrations/verification_tables.sql in your Supabase dashboard SQL editor.');
      } else {
        console.log('Verification_codes table created successfully');
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing auth tables:', error);
    return { success: false, error };
  }
};

// Run the initialization (but don't wait for it to finish)
initializeAuthTables().then(result => {
  if (result.success) {
    console.log('Auth tables initialized successfully');
  }
});

export const testTableAccess = async () => {
  try {
    const { error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('Cannot connect to Supabase:', versionError);
      return { success: false, message: 'Connection error', error: versionError };
    }
  
    const { data: testData, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Cannot access clients table:', error);
      return { success: false, message: 'Table access error', error };
    }
    
    return { 
      success: true, 
      message: 'Successfully accessed clients table',
      data: testData
    };
  } catch (err) {
    console.error('Unexpected error testing table access:', err);
    return { success: false, message: 'Test failed', error: err };
  }
};

// Function to diagnose suppliers table schema
export const testSupplierColumns = async () => {
  console.log('Testing supplier table columns...');
  try {
    // Try to get a single record to see what columns exist
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing suppliers table:', error);
      return { success: false, message: 'Cannot access suppliers table', error };
    }

    if (!data || data.length === 0) {
      // If no records, try to insert a minimal one to check column names
      const testSupplier = {
        name: 'Test Supplier',
        // Try different column name variations
        contactPerson: 'Test Contact',
        contactperson: 'Test Contact',
        contact_person: 'Test Contact'
      };

      console.log('No suppliers found, trying to create test supplier:', testSupplier);
      
      const { data: insertData, error: insertError } = await supabase
        .from('suppliers')
        .insert([testSupplier])
        .select();

      if (insertError) {
        console.error('Error creating test supplier:', insertError);
        return { 
          success: false, 
          message: 'Failed to create test supplier', 
          error: insertError,
          attemptedColumns: Object.keys(testSupplier)
        };
      }

      console.log('Successfully created test supplier, columns accepted:', insertData);
      return {
        success: true,
        message: 'Successfully created test supplier',
        data: insertData
      };
    }

    // If we have data, analyze what columns are available
    console.log('Found supplier record, available columns:', Object.keys(data[0]));
    
    return {
      success: true,
      message: 'Found existing supplier record',
      availableColumns: Object.keys(data[0]),
      sampleData: data[0]
    };
  } catch (err) {
    console.error('Unexpected error testing supplier columns:', err);
    return { success: false, message: 'Supplier column test failed', error: err };
  }
};

export const validateSchema = async () => {
  try {
    const { data: error } = await supabase
      .from('clients')
      .select('id, name, contactPerson, email, phone, status')
      .limit(1);
      
    if (error) {
      return { 
        success: false, 
        message: 'Error accessing required tables/columns', 
        error 
      };
    }

    const tables = ['clients', 'order_requests', 'order_request_items'];
    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const { error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        return { table, exists: !tableError };
      })
    );
    
    const missingTables = tableChecks.filter(t => !t.exists).map(t => t.table);
    
    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Missing required tables: ${missingTables.join(', ')}`,
        missingTables
      };
    }
    
    return {
      success: true,
      message: 'Database schema validation passed',
      tables: tableChecks
    };
  } catch (err) {
    console.error('Unexpected error validating schema:', err);
    return { success: false, message: 'Schema validation failed', error: err };
  }
};

export const runMigrations = async () => {
  try {
    // First, add the camelCase updatedAt column if it doesn't exist
    const updateCamelCaseQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'clients' AND column_name = 'updatedAt') THEN
          ALTER TABLE clients ADD COLUMN "updatedAt" timestamp DEFAULT now();
        END IF;
      END
      $$;
    `;
    
    const { error: camelCaseError } = await supabase.rpc('pg_query', { query: updateCamelCaseQuery });
    
    if (camelCaseError) {
      return { success: false, message: 'Failed to add updatedAt column', error: camelCaseError };
    }
    
    // Now add snake_case updated_at column for compatibility
    const updateSnakeCaseQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
          ALTER TABLE clients ADD COLUMN updated_at timestamp DEFAULT now();
        END IF;
      END
      $$;
    `;
    
    const { error: snakeCaseError } = await supabase.rpc('pg_query', { query: updateSnakeCaseQuery });
    
    if (snakeCaseError) {
      return { success: false, message: 'Failed to add updated_at column', error: snakeCaseError };
    }
    
    // Create a trigger that updates both forms of the timestamp
    const triggerQuery = `
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now();
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_clients_modtime ON clients;

      CREATE TRIGGER update_clients_modtime
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
    `;
    
    const { error: triggerError } = await supabase.rpc('pg_query', { query: triggerQuery });
    
    if (triggerError) {
      return { 
        success: false, 
        message: 'Failed to create update trigger', 
        error: triggerError 
      };
    }
    
    return { success: true, message: 'Migrations completed successfully' };
  } catch (err) {
    console.error('Error running migrations:', err);
    return { success: false, message: 'Migration execution failed', error: err };
  }
};

// Migration disabled due to RPC errors
// runMigrations().then(result => {
//   console.log('Migration result:', result);
// }).catch(err => {
//   console.error('Migration error:', err);
// });