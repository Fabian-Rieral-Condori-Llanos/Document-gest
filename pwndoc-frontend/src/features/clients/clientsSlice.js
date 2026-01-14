import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientsApi } from '../../api/endpoints/clients.api';

/**
 * Clients Thunks
 */
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientsApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener entidades');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await clientsApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener entidad');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientsApi.create(clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear entidad');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, clientData }, { rejectWithValue }) => {
    try {
      const response = await clientsApi.update(id, clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar entidad');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (id, { rejectWithValue }) => {
    try {
      await clientsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar entidad');
    }
  }
);

/**
 * Clients Slice
 */
const initialState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    company: '',
  },
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.clients.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.selectedClient?._id === action.payload._id) {
          state.selectedClient = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = state.clients.filter(c => c._id !== action.payload);
        if (state.selectedClient?._id === action.payload) {
          state.selectedClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedClient,
  clearSelectedClient,
  setFilters,
  clearFilters,
} = clientsSlice.actions;

/**
 * Selectors
 */
export const selectAllClients = (state) => state.clients.clients;
export const selectSelectedClient = (state) => state.clients.selectedClient;
export const selectClientsLoading = (state) => state.clients.loading;
export const selectClientsError = (state) => state.clients.error;
export const selectClientsFilters = (state) => state.clients.filters;

export const selectFilteredClients = (state) => {
  const { clients, filters } = state.clients;
  const companies = state.companies?.companies || [];
  
  return clients.filter(client => {
    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        client.email?.toLowerCase().includes(search) ||
        client.firstname?.toLowerCase().includes(search) ||
        client.lastname?.toLowerCase().includes(search) ||
        client.title?.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }
    
    // Filtro por empresa (filters.company es el ID de la empresa seleccionada)
    if (filters.company) {
      // client.company viene del backend como { name: "..." } (populado sin _id)
      // Necesitamos comparar el nombre
      const clientCompanyName = typeof client.company === 'object' 
        ? client.company?.name 
        : '';
      
      // Buscar el nombre de la empresa filtrada por su ID
      const filteredCompany = companies.find(c => c._id === filters.company);
      const filteredCompanyName = filteredCompany?.name || '';
      
      if (clientCompanyName !== filteredCompanyName) return false;
    }
    
    return true;
  });
};

export default clientsSlice.reducer;