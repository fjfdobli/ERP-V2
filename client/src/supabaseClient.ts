import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iyjfpkcxwljfkxbjagbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5amZwa2N4d2xqZmt4YmphZ2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2Njg5NzUsImV4cCI6MjA1ODI0NDk3NX0.0fJgoMe23ZPE1Rgz70RFwV31c3qRGnt1Cciz-x_F0io';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testTableAccess = async () => {
  try {
    const { error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('Cannot connect to Supabase:', versionError);
      return { success: false, message: 'Connection error', error: versionError };
    }
    
    const { data, error } = await supabase
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
      data
    };
  } catch (err) {
    console.error('Unexpected error testing table access:', err);
    return { success: false, message: 'Test failed', error: err };
  }
};