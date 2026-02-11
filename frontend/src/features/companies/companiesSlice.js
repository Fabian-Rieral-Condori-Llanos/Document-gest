import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companiesApi } from '../../api/endpoints/companies.api';

/**
 * Companies Thunks
 */
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener empresas');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'companies/fetchCompanyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener empresa');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await companiesApi.create(companyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear empresa');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async ({ id, companyData }, { rejectWithValue }) => {
    try {
      const response = await companiesApi.update(id, companyData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar empresa');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id, { rejectWithValue }) => {
    try {
      await companiesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar empresa');
    }
  }
);

/**
 * Companies Slice
 */
const initialState = {
  companies: [],
  selectedCompany: null,
  loading: false,
  error: null,
  filters: {
    search: '',
  },
};

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },
    clearSelectedCompany: (state) => {
      state.selectedCompany = null;
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
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCompany = action.payload;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies.push(action.payload);
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.companies.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
        if (state.selectedCompany?._id === action.payload._id) {
          state.selectedCompany = action.payload;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = state.companies.filter(c => c._id !== action.payload);
        if (state.selectedCompany?._id === action.payload) {
          state.selectedCompany = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedCompany,
  clearSelectedCompany,
  setFilters,
  clearFilters,
} = companiesSlice.actions;

/**
 * Selectors
 */
export const selectAllCompanies = (state) => state.companies.companies;
export const selectSelectedCompany = (state) => state.companies.selectedCompany;
export const selectCompaniesLoading = (state) => state.companies.loading;
export const selectCompaniesError = (state) => state.companies.error;
export const selectCompaniesFilters = (state) => state.companies.filters;

export const selectFilteredCompanies = (state) => {
  const { companies, filters } = state.companies;
  
  return companies.filter(company => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        company.name?.toLowerCase().includes(search) ||
        company.shortName?.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });
};

export default companiesSlice.reducer;