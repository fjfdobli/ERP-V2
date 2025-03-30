import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyjfpkcxwljfkxbjagbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5amZwa2N4d2xqZmt4YmphZ2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2Njg5NzUsImV4cCI6MjA1ODI0NDk3NX0.0fJgoMe23ZPE1Rgz70RFwV31c3qRGnt1Cciz-x_F0io';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'x-application-name': 'opzons-printing-press'
    }
  },
  db: {
    schema: 'public'
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
    const updateQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'clients' AND column_name = 'updatedAt') THEN
          ALTER TABLE clients ADD COLUMN "updatedAt" timestamp DEFAULT now();
        END IF;
      END
      $$;
    `;
    
    const { error } = await supabase.rpc('pg_query', { query: updateQuery });
    
    if (error) {
      return { success: false, message: 'Failed to run migration', error };
    }
    
    const triggerQuery = `
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now(); 
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