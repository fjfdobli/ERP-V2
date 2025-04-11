import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabaseClient';

interface User {
  id: string;
  email: string | undefined;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  jobTitle?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  settings?: UserSettings;
  avatarUrl?: string;
  user_metadata?: any; // Additional metadata stored in Supabase
}

interface UserSettings {
  emailNotifications?: boolean;
  appNotifications?: boolean;
  darkMode?: boolean;
  language?: string;
  theme?: string;
  twoFactorAuth?: boolean;
  compactView?: boolean;
  autoLogout?: boolean;
  logoutTime?: number;
  defaultView?: string;
  inventoryAlerts?: boolean;
  showPendingOrders?: boolean;
  orderPriorityColors?: boolean;
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

// Create user object from Supabase auth data
const createUserFromAuthData = (authUser: any): User | null => {
  if (!authUser) return null;
  
  return {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.user_metadata?.firstName || '',
    lastName: authUser.user_metadata?.lastName || '',
    role: 'Admin', // Always set role to Admin regardless of metadata
    phone: authUser.user_metadata?.phone || '',
    jobTitle: authUser.user_metadata?.jobTitle || '',
    emailVerified: authUser.user_metadata?.emailVerified || false,
    phoneVerified: authUser.user_metadata?.phoneVerified || false,
    avatarUrl: authUser.user_metadata?.avatarUrl || '',
    settings: authUser.user_metadata?.settings || {
      darkMode: false,
      language: 'en',
      emailNotifications: true,
      appNotifications: true
    },
    user_metadata: authUser.user_metadata // Include all metadata for extended profile data
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
  async ({ 
    email, 
    password, 
    firstName, 
    lastName, 
    phone
  }: { 
    email: string; 
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }, { rejectWithValue }) => {
    try {
      console.log('Registering user:', { email, firstName, lastName, phone });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            phone,
            role: 'Admin' // Explicitly set role to Admin when registering
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
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
      
      return {
        success: true,
        user: data.user,
        message: 'Registration successful! Please check your email for verification instructions.'
      };
    } catch (error: any) {
      console.error('Unexpected registration error:', error);
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const sendEmailVerificationCode = createAsyncThunk(
  'auth/sendEmailVerificationCode',
  async (email: string, { rejectWithValue }) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await supabase
        .from('verification_codes')
        .insert({
          email,
          code,
          type: 'email',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() 
        });
      
      if (error) {
        console.error('Error storing verification code:', error);
        return rejectWithValue(error.message);
      }
      
      console.log(`Email verification code for ${email}: ${code}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      return rejectWithValue(error.message || 'Failed to send verification code');
    }
  }
);

export const sendPhoneVerificationCode = createAsyncThunk(
  'auth/sendPhoneVerificationCode',
  async (phone: string, { rejectWithValue }) => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await supabase
        .from('verification_codes')
        .insert({
          phone,
          code,
          type: 'phone',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() 
        });
      
      if (error) {
        console.error('Error storing verification code:', error);
        return rejectWithValue(error.message);
      }
      
      console.log(`Phone verification code for ${phone}: ${code}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      return rejectWithValue(error.message || 'Failed to send verification code');
    }
  }
);

export const verifyEmailCode = createAsyncThunk(
  'auth/verifyEmailCode',
  async ({ email, code }: { email: string; code: string }, { getState, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', 'email')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error verifying code:', error);
        return rejectWithValue('Invalid or expired verification code');
      }
      
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', data.id);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          emailVerified: true
        }
      });
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        return rejectWithValue(updateError.message);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      return rejectWithValue(error.message || 'Failed to verify email');
    }
  }
);

export const verifyPhoneCode = createAsyncThunk(
  'auth/verifyPhoneCode',
  async ({ phone, code }: { phone: string; code: string }, { getState, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('type', 'phone')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error verifying code:', error);
        return rejectWithValue('Invalid or expired verification code');
      }
      
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', data.id);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          phoneVerified: true,
          phone: phone
        }
      });
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        return rejectWithValue(updateError.message);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error verifying phone code:', error);
      return rejectWithValue(error.message || 'Failed to verify phone');
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
  async (profileData: Partial<User & { user_metadata?: any }>, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const { user } = state.auth;
      
      if (!user || !user.id) {
        return rejectWithValue('User not authenticated');
      }
      
      // Get current user data first to preserve existing metadata
      const { data: currentUserData } = await supabase.auth.getUser();
      const currentMetadata = currentUserData.user?.user_metadata || {};
      
      // Update user metadata in Supabase Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          firstName: profileData.firstName ?? user.firstName,
          lastName: profileData.lastName ?? user.lastName,
          phone: profileData.phone ?? user.phone,
          jobTitle: profileData.jobTitle ?? user.jobTitle,
          avatarUrl: profileData.avatarUrl ?? user.avatarUrl,
          emailVerified: profileData.emailVerified ?? user.emailVerified,
          phoneVerified: profileData.phoneVerified ?? user.phoneVerified,
          role: 'Admin', // Ensure role stays as Admin when updating profile
          // Spread additional metadata fields
          ...(profileData.user_metadata || {}),
          // Preserve existing metadata that wasn't in the update
          ...Object.fromEntries(
            Object.entries(currentMetadata)
              .filter(([key]) => !['firstName', 'lastName', 'phone', 'jobTitle', 'avatarUrl', 'emailVerified', 'phoneVerified', 'role'].includes(key) && 
                                !(profileData.user_metadata && key in profileData.user_metadata))
          )
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
        role: 'Admin',
        phone: '+639123456789',
        emailVerified: true,
        phoneVerified: true
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
      
      .addCase(sendEmailVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendEmailVerificationCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendEmailVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(sendPhoneVerificationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPhoneVerificationCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendPhoneVerificationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(verifyEmailCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmailCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmailCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(verifyPhoneCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPhoneCode.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyPhoneCode.rejected, (state, action) => {
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