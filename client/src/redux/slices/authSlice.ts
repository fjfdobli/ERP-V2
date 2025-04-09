import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

interface User {
  id: string; // Changed to string to match Supabase auth user id
  email: string | undefined;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  jobTitle?: string;
  settings?: UserSettings;
}

interface UserSettings {
  emailNotifications?: boolean;
  appNotifications?: boolean;
  darkMode?: boolean;
  language?: string;
  theme?: string;
  twoFactorAuth?: boolean;
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

// Simplified function to create a user object from Supabase auth data
const createUserFromAuthData = (authUser: any): User | null => {
  if (!authUser) return null;
  
  return {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.user_metadata?.firstName || '',
    lastName: authUser.user_metadata?.lastName || '',
    role: authUser.user_metadata?.role || 'user',
    phone: authUser.user_metadata?.phone || '',
    jobTitle: authUser.user_metadata?.jobTitle || '',
    settings: authUser.user_metadata?.settings || {
      darkMode: false,
      language: 'en',
      emailNotifications: true,
      appNotifications: true
    }
  };
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
      
      const user = createUserFromAuthData(data.user);
      
      return { 
        session: data.session, 
        user 
      };
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
            lastName,
            role: 'user' // Default role for new users
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
      
      const user = createUserFromAuthData(data.user);
      return user;
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Failed to get user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const { user } = state.auth;
      
      if (!user || !user.id) {
        return rejectWithValue('User not authenticated');
      }
      
      // Update user metadata in Supabase Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          firstName: profileData.firstName ?? user.firstName,
          lastName: profileData.lastName ?? user.lastName,
          phone: profileData.phone ?? user.phone,
          jobTitle: profileData.jobTitle ?? user.jobTitle
        }
      });
      
      if (authUpdateError) {
        console.error('Error updating user metadata:', authUpdateError);
        return rejectWithValue(authUpdateError.message);
      }
      
      // Get updated user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return rejectWithValue(userError?.message || 'Failed to get updated user data');
      }
      
      const updatedUser = createUserFromAuthData(userData.user);
      return updatedUser;
    } catch (error: any) {
      console.error('Unexpected profile update error:', error);
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'auth/updateUserSettings',
  async (settings: UserSettings, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const { user } = state.auth;
      
      if (!user || !user.id) {
        return rejectWithValue('User not authenticated');
      }
      
      // Get current user data first
      const { data: userData } = await supabase.auth.getUser();
      const currentMetadata = userData.user?.user_metadata || {};
      
      // Update user metadata with new settings
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          settings: {
            ...currentMetadata.settings,
            ...settings
          }
        }
      });
      
      if (authUpdateError) {
        console.error('Error updating user settings:', authUpdateError);
        return rejectWithValue(authUpdateError.message);
      }
      
      // Get the updated user with new settings
      const { data: updatedUserData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !updatedUserData.user) {
        return rejectWithValue(userError?.message || 'Failed to get updated user data');
      }
      
      const updatedUser = createUserFromAuthData(updatedUserData.user);
      return updatedUser;
    } catch (error: any) {
      console.error('Unexpected settings update error:', error);
      return rejectWithValue(error.message || 'Settings update failed');
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
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
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
      })
      
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateUserSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { logout, clearError, setMockAuthState, setUser } = authSlice.actions;
export default authSlice.reducer;