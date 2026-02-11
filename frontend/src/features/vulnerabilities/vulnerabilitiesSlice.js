import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vulnerabilitiesApi, dataApi } from '../../api/endpoints/vulnerabilities.api';

/**
 * Vulnerabilities Thunks
 */
export const fetchVulnerabilities = createAsyncThunk(
  'vulnerabilities/fetchVulnerabilities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await vulnerabilitiesApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener vulnerabilidades');
    }
  }
);

export const fetchVulnerabilityById = createAsyncThunk(
  'vulnerabilities/fetchVulnerabilityById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await vulnerabilitiesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener vulnerabilidad');
    }
  }
);

export const createVulnerability = createAsyncThunk(
  'vulnerabilities/createVulnerability',
  async (vulnData, { rejectWithValue }) => {
    try {
      const response = await vulnerabilitiesApi.create(vulnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear vulnerabilidad');
    }
  }
);

export const updateVulnerability = createAsyncThunk(
  'vulnerabilities/updateVulnerability',
  async ({ id, vulnData }, { rejectWithValue }) => {
    try {
      const response = await vulnerabilitiesApi.update(id, vulnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar vulnerabilidad');
    }
  }
);

export const deleteVulnerability = createAsyncThunk(
  'vulnerabilities/deleteVulnerability',
  async (id, { rejectWithValue }) => {
    try {
      await vulnerabilitiesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar vulnerabilidad');
    }
  }
);

export const deleteManyVulnerabilities = createAsyncThunk(
  'vulnerabilities/deleteManyVulnerabilities',
  async (ids, { rejectWithValue }) => {
    try {
      await vulnerabilitiesApi.deleteMany(ids);
      return ids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar vulnerabilidades');
    }
  }
);

// Data auxiliar
export const fetchVulnerabilityTypes = createAsyncThunk(
  'vulnerabilities/fetchVulnerabilityTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getVulnerabilityTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener tipos');
    }
  }
);

export const fetchVulnerabilityCategories = createAsyncThunk(
  'vulnerabilities/fetchVulnerabilityCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getVulnerabilityCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener categorías');
    }
  }
);

export const fetchLanguages = createAsyncThunk(
  'vulnerabilities/fetchLanguages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getLanguages();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener idiomas');
    }
  }
);

/**
 * Vulnerabilities Slice
 */
const initialState = {
  vulnerabilities: [],
  selectedVulnerability: null,
  // Datos auxiliares
  types: [],
  categories: [],
  languages: [],
  // Estados
  loading: false,
  loadingAux: false,
  error: null,
  // Filtros
  filters: {
    search: '',
    category: '',
    priority: '',
    locale: 'es',
  },
  // Selección múltiple
  selectedIds: [],
};

// Mapeo de prioridades
export const PRIORITY_MAP = {
  1: { label: 'Crítica', color: 'danger', value: 1 },
  2: { label: 'Alta', color: 'warning', value: 2 },
  3: { label: 'Media', color: 'info', value: 3 },
  4: { label: 'Baja', color: 'success', value: 4 },
};

// Mapeo de complejidad de remediación
export const COMPLEXITY_MAP = {
  1: { label: 'Baja', color: 'success' },
  2: { label: 'Media', color: 'warning' },
  3: { label: 'Alta', color: 'danger' },
};

// Estados de vulnerabilidad
export const STATUS_MAP = {
  0: { label: 'Validada', color: 'success' },
  1: { label: 'Creada', color: 'info' },
  2: { label: 'Actualizada', color: 'warning' },
};

const vulnerabilitiesSlice = createSlice({
  name: 'vulnerabilities',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedVulnerability: (state, action) => {
      state.selectedVulnerability = action.payload;
    },
    clearSelectedVulnerability: (state) => {
      state.selectedVulnerability = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { ...initialState.filters, locale: state.filters.locale };
    },
    toggleSelectId: (state, action) => {
      const id = action.payload;
      const index = state.selectedIds.indexOf(id);
      if (index === -1) {
        state.selectedIds.push(id);
      } else {
        state.selectedIds.splice(index, 1);
      }
    },
    selectAllIds: (state, action) => {
      state.selectedIds = action.payload;
    },
    clearSelectedIds: (state) => {
      state.selectedIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchVulnerabilities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVulnerabilities.fulfilled, (state, action) => {
        state.loading = false;
        state.vulnerabilities = action.payload;
      })
      .addCase(fetchVulnerabilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchVulnerabilityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVulnerabilityById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVulnerability = action.payload;
      })
      .addCase(fetchVulnerabilityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createVulnerability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVulnerability.fulfilled, (state, action) => {
        state.loading = false;
        // El resultado puede ser un array o un objeto
        const created = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.vulnerabilities.push(...created);
      })
      .addCase(createVulnerability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateVulnerability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVulnerability.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vulnerabilities.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.vulnerabilities[index] = action.payload;
        }
        if (state.selectedVulnerability?._id === action.payload._id) {
          state.selectedVulnerability = action.payload;
        }
      })
      .addCase(updateVulnerability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteVulnerability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVulnerability.fulfilled, (state, action) => {
        state.loading = false;
        state.vulnerabilities = state.vulnerabilities.filter(v => v._id !== action.payload);
        if (state.selectedVulnerability?._id === action.payload) {
          state.selectedVulnerability = null;
        }
      })
      .addCase(deleteVulnerability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete many
      .addCase(deleteManyVulnerabilities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManyVulnerabilities.fulfilled, (state, action) => {
        state.loading = false;
        state.vulnerabilities = state.vulnerabilities.filter(v => !action.payload.includes(v._id));
        state.selectedIds = [];
      })
      .addCase(deleteManyVulnerabilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch types
      .addCase(fetchVulnerabilityTypes.pending, (state) => {
        state.loadingAux = true;
      })
      .addCase(fetchVulnerabilityTypes.fulfilled, (state, action) => {
        state.loadingAux = false;
        state.types = action.payload;
      })
      .addCase(fetchVulnerabilityTypes.rejected, (state) => {
        state.loadingAux = false;
      })
      // Fetch categories
      .addCase(fetchVulnerabilityCategories.pending, (state) => {
        state.loadingAux = true;
      })
      .addCase(fetchVulnerabilityCategories.fulfilled, (state, action) => {
        state.loadingAux = false;
        state.categories = action.payload;
      })
      .addCase(fetchVulnerabilityCategories.rejected, (state) => {
        state.loadingAux = false;
      })
      // Fetch languages
      .addCase(fetchLanguages.pending, (state) => {
        state.loadingAux = true;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.loadingAux = false;
        state.languages = action.payload;
      })
      .addCase(fetchLanguages.rejected, (state) => {
        state.loadingAux = false;
      });
  },
});

export const {
  clearError,
  setSelectedVulnerability,
  clearSelectedVulnerability,
  setFilters,
  clearFilters,
  toggleSelectId,
  selectAllIds,
  clearSelectedIds,
} = vulnerabilitiesSlice.actions;

/**
 * Selectors
 */
export const selectAllVulnerabilities = (state) => state.vulnerabilities.vulnerabilities;
export const selectSelectedVulnerability = (state) => state.vulnerabilities.selectedVulnerability;
export const selectVulnerabilitiesLoading = (state) => state.vulnerabilities.loading;
export const selectVulnerabilitiesError = (state) => state.vulnerabilities.error;
export const selectVulnerabilitiesFilters = (state) => state.vulnerabilities.filters;
export const selectSelectedIds = (state) => state.vulnerabilities.selectedIds;
export const selectVulnerabilityTypes = (state) => state.vulnerabilities.types;
export const selectVulnerabilityCategories = (state) => state.vulnerabilities.categories;
export const selectLanguages = (state) => state.vulnerabilities.languages;

// Helper para obtener el título en el locale actual
export const getVulnTitle = (vuln, locale = 'es') => {
  if (!vuln?.details) return 'Sin título';
  const detail = vuln.details.find(d => d.locale === locale) || vuln.details[0];
  return detail?.title || 'Sin título';
};

// Helper para obtener los detalles en el locale actual
export const getVulnDetails = (vuln, locale = 'es') => {
  if (!vuln?.details) return null;
  return vuln.details.find(d => d.locale === locale) || vuln.details[0];
};

export const selectFilteredVulnerabilities = (state) => {
  const { vulnerabilities, filters } = state.vulnerabilities;
  const locale = filters.locale || 'es';
  
  return vulnerabilities.filter(vuln => {
    // Obtener detalles en el locale actual
    const details = getVulnDetails(vuln, locale);
    
    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        details?.title?.toLowerCase().includes(search) ||
        details?.description?.toLowerCase().includes(search) ||
        vuln.cvssv3?.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }
    
    // Filtro por categoría
    if (filters.category && vuln.category !== filters.category) {
      return false;
    }
    
    // Filtro por prioridad
    if (filters.priority && vuln.priority !== Number(filters.priority)) {
      return false;
    }
    
    return true;
  });
};

export default vulnerabilitiesSlice.reducer;