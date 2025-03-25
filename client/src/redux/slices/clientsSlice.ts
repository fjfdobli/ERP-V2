import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from './apiClient';
import { clientsService } from '../../services/clientsService';

interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null
};

// Map service client to the format expected by the application
const mapServiceClientToClient = (client: any): Client => {
  return {
    id: client.id?.toString() || '',
    name: client.name || '',
    contactPerson: client.contactPerson || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    notes: client.notes || '',
    createdAt: client.createdAt || client.created_at,
    updatedAt: client.updatedAt || client.updated_at
  };
};

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      try {
        // First try the API
        const response = await apiClient.get('/clients');
        return response.data.data;
      } catch (apiError) {
        // On API failure, use the clients service with mock data
        console.log('API fetch failed, using clients service');
        const clients = await clientsService.getClients();
        return clients.map(mapServiceClientToClient);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch clients');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data.data;
      } catch (apiError) {
        // On API failure, use the clients service with mock data
        const client = await clientsService.getClientById(parseInt(id));
        return mapServiceClientToClient(client);
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch client');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData: Partial<Client>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/clients', clientData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }: { id: string; data: Partial<Client> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/clients/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/clients/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete client');
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.clients = []; // Empty data on error
      })
      
      .addCase(fetchClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        state.currentClient = action.payload;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter(client => client.id !== action.payload);
        if (state.currentClient && state.currentClient.id === action.payload) {
          state.currentClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentClient, clearError } = clientsSlice.actions;
export default clientsSlice.reducer;