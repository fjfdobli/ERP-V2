import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

interface User {
  id: number;
  auth_id: string;
  email: string | undefined;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

// Helper function to create or get user profile
const getOrCreateUserProfile = async (authUser: any) => {
  if (!authUser) return null;
  
  try {
    // Check if user profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching user profile:', fetchError);
      throw new Error(`Error fetching user profile: ${fetchError.message}`);
    }

    if (existingProfile) {
      return {
        id: existingProfile.id,
        auth_id: authUser.id,
        email: authUser.email,
        firstName: authUser.user_metadata?.firstName || existingProfile.first_name,
        lastName: authUser.user_metadata?.lastName || existingProfile.last_name,
        role: existingProfile.role
      };
    }

    // If we don't find a profile, create one
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert([
        { 
          auth_user_id: authUser.id, 
          first_name: authUser.user_metadata?.firstName || '',
          last_name: authUser.user_metadata?.lastName || '',
          email: authUser.email
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user profile:', insertError);
      throw new Error(`Error creating user profile: ${insertError.message}`);
    }

    return {
      id: newProfile.id,
      auth_id: authUser.id,
      email: authUser.email,
      firstName: authUser.user_metadata?.firstName || newProfile.first_name,
      lastName: authUser.user_metadata?.lastName || newProfile.last_name,
      role: newProfile.role
    };
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    // Return a basic profile with just the auth data to prevent the app from breaking
    return {
      id: 0, // Placeholder ID
      auth_id: authUser.id,
      email: authUser.email,
      firstName: authUser.user_metadata?.firstName,
      lastName: authUser.user_metadata?.lastName,
    };
  }
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        return rejectWithValue(error.message);
      }
      
      if (!data?.session?.access_token) {
        return rejectWithValue('Invalid response format from server');
      }
      
      localStorage.setItem('token', data.session.access_token);
      
      try {
        const userProfile = await getOrCreateUserProfile(data.user);
        return { 
          session: data.session, 
          user: userProfile 
        };
      } catch (profileError: any) {
        // Log the error but still return basic user data
        console.error('Profile error during login:', profileError);
        return { 
          session: data.session, 
          user: {
            id: 0,
            auth_id: data.user.id,
            email: data.user.email,
            firstName: data.user.user_metadata?.firstName,
            lastName: data.user.user_metadata?.lastName,
          }
        };
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, firstName, lastName }: { 
    email: string; 
    password: string;
    firstName?: string;
    lastName?: string;
  }, { rejectWithValue }) => {
    try {
      console.log('Registering user:', { email, firstName, lastName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        return rejectWithValue(error.message);
      }
      
      if (!data?.user) {
        return rejectWithValue('Registration successful but no user data returned');
      }
      
      console.log('Registration successful:', data);
      
      // Don't try to create a profile yet - we'll do that on login
      // This avoids potential race conditions with Supabase auth
      
      return data;
    } catch (error: any) {
      console.error('Unexpected registration error:', error);
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        localStorage.removeItem('token');
        return rejectWithValue(error?.message || 'User not authenticated');
      }
      
      try {
        const userProfile = await getOrCreateUserProfile(data.user);
        return userProfile;
      } catch (profileError: any) {
        // Return basic user data on profile error
        console.error('Profile error in getCurrentUser:', profileError);
        return {
          id: 0,
          auth_id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
        };
      }
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Failed to get user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      supabase.auth.signOut();
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setMockAuthState: (state) => {
      state.user = {
        id: 1,
        auth_id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.session.access_token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        // We don't set the user here because they need to log in after registration
        // This also handles Supabase email confirmation flow
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  }
});

export const { logout, clearError, setMockAuthState } = authSlice.actions;
export default authSlice.reducer;