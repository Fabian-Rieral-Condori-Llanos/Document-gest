import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import alcanceTemplatesApi from '../../api/endpoints/alcance-templates.api';

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Obtener todas las plantillas
 */
export const fetchAlcanceTemplates = createAsyncThunk(
  'alcanceTemplates/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching alcance templates');
    }
  }
);

/**
 * Obtener solo plantillas activas
 */
export const fetchActiveAlcanceTemplates = createAsyncThunk(
  'alcanceTemplates/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.getActive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching active templates');
    }
  }
);

/**
 * Obtener estadísticas
 */
export const fetchAlcanceTemplateStats = createAsyncThunk(
  'alcanceTemplates/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching stats');
    }
  }
);

/**
 * Obtener plantilla por ID
 */
export const fetchAlcanceTemplateById = createAsyncThunk(
  'alcanceTemplates/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching alcance template');
    }
  }
);

/**
 * Crear plantilla
 */
export const createAlcanceTemplate = createAsyncThunk(
  'alcanceTemplates/create',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.create(templateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error creating alcance template');
    }
  }
);

/**
 * Actualizar plantilla
 */
export const updateAlcanceTemplate = createAsyncThunk(
  'alcanceTemplates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error updating alcance template');
    }
  }
);

/**
 * Activar/desactivar plantilla
 */
export const toggleAlcanceTemplate = createAsyncThunk(
  'alcanceTemplates/toggle',
  async (id, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.toggle(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error toggling alcance template');
    }
  }
);

/**
 * Eliminar plantilla
 */
export const deleteAlcanceTemplate = createAsyncThunk(
  'alcanceTemplates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await alcanceTemplatesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error deleting alcance template');
    }
  }
);

/**
 * Inicializar plantillas por defecto
 */
export const initializeAlcanceTemplates = createAsyncThunk(
  'alcanceTemplates/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alcanceTemplatesApi.initialize();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error initializing templates');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Lista completa (para admin)
  templates: [],
  templatesLoading: false,
  templatesError: null,
  
  // Lista activa (para selectores)
  activeTemplates: [],
  activeTemplatesLoading: false,
  
  // Template seleccionado
  selectedTemplate: null,
  selectedTemplateLoading: false,
  selectedTemplateError: null,
  
  // Estadísticas
  stats: null,
  statsLoading: false,
  
  // Filtros
  filters: {
    search: '',
    isActive: undefined,
  },
  
  // Paginación
  pagination: {
    page: 1,
    pageSize: 10,
  },
  
  // Estado de operaciones
  operationLoading: false,
  operationError: null,
  operationSuccess: null,
};

// ============================================
// SLICE
// ============================================

const alcanceTemplatesSlice = createSlice({
  name: 'alcanceTemplates',
  initialState,
  reducers: {
    // Filtros
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset page on filter change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    
    // Paginación
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1;
    },
    
    // Limpiar selección
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
      state.selectedTemplateError = null;
    },
    
    // Limpiar errores
    clearError: (state) => {
      state.templatesError = null;
      state.selectedTemplateError = null;
      state.operationError = null;
    },
    
    // Limpiar estado de operación
    clearOperationState: (state) => {
      state.operationLoading = false;
      state.operationError = null;
      state.operationSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAlcanceTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchAlcanceTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAlcanceTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload;
      })
      
      // Fetch active
      .addCase(fetchActiveAlcanceTemplates.pending, (state) => {
        state.activeTemplatesLoading = true;
      })
      .addCase(fetchActiveAlcanceTemplates.fulfilled, (state, action) => {
        state.activeTemplatesLoading = false;
        state.activeTemplates = action.payload;
      })
      .addCase(fetchActiveAlcanceTemplates.rejected, (state) => {
        state.activeTemplatesLoading = false;
      })
      
      // Fetch stats
      .addCase(fetchAlcanceTemplateStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAlcanceTemplateStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAlcanceTemplateStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch by ID
      .addCase(fetchAlcanceTemplateById.pending, (state) => {
        state.selectedTemplateLoading = true;
        state.selectedTemplateError = null;
      })
      .addCase(fetchAlcanceTemplateById.fulfilled, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchAlcanceTemplateById.rejected, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplateError = action.payload;
      })
      
      // Create
      .addCase(createAlcanceTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(createAlcanceTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Alcance creado exitosamente';
        state.templates.push(action.payload);
      })
      .addCase(createAlcanceTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update
      .addCase(updateAlcanceTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(updateAlcanceTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Alcance actualizado exitosamente';
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.selectedTemplate?._id === action.payload._id) {
          state.selectedTemplate = action.payload;
        }
      })
      .addCase(updateAlcanceTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Toggle
      .addCase(toggleAlcanceTemplate.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(toggleAlcanceTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = `Alcance ${action.payload.isActive ? 'activado' : 'desactivado'}`;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(toggleAlcanceTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Delete
      .addCase(deleteAlcanceTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(deleteAlcanceTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Alcance eliminado exitosamente';
        state.templates = state.templates.filter(t => t._id !== action.payload);
      })
      .addCase(deleteAlcanceTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Initialize
      .addCase(initializeAlcanceTemplates.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(initializeAlcanceTemplates.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = action.payload.message;
        // Agregar los nuevos templates creados
        if (action.payload.created?.length > 0) {
          state.templates.push(...action.payload.created);
        }
      })
      .addCase(initializeAlcanceTemplates.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  setPage,
  setPageSize,
  clearSelectedTemplate,
  clearError,
  clearOperationState,
} = alcanceTemplatesSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllAlcanceTemplates = (state) => state.alcanceTemplates.templates;
export const selectAlcanceTemplatesLoading = (state) => state.alcanceTemplates.templatesLoading;
export const selectAlcanceTemplatesError = (state) => state.alcanceTemplates.templatesError;

export const selectActiveAlcanceTemplates = (state) => state.alcanceTemplates.activeTemplates;
export const selectActiveAlcanceTemplatesLoading = (state) => state.alcanceTemplates.activeTemplatesLoading;

export const selectSelectedAlcanceTemplate = (state) => state.alcanceTemplates.selectedTemplate;
export const selectSelectedAlcanceTemplateLoading = (state) => state.alcanceTemplates.selectedTemplateLoading;
export const selectSelectedAlcanceTemplateError = (state) => state.alcanceTemplates.selectedTemplateError;

export const selectAlcanceTemplateStats = (state) => state.alcanceTemplates.stats;
export const selectAlcanceTemplateStatsLoading = (state) => state.alcanceTemplates.statsLoading;

export const selectAlcanceTemplateFilters = (state) => state.alcanceTemplates.filters;
export const selectAlcanceTemplatePagination = (state) => state.alcanceTemplates.pagination;

export const selectAlcanceTemplateOperationLoading = (state) => state.alcanceTemplates.operationLoading;
export const selectAlcanceTemplateOperationError = (state) => state.alcanceTemplates.operationError;
export const selectAlcanceTemplateOperationSuccess = (state) => state.alcanceTemplates.operationSuccess;

// Selector filtrado
export const selectFilteredAlcanceTemplates = (state) => {
  const { templates, filters } = state.alcanceTemplates;
  
  return templates.filter(template => {
    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        template.name?.toLowerCase().includes(search) ||
        template.description?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    // Filtro por estado activo
    if (filters.isActive !== undefined) {
      if (template.isActive !== filters.isActive) return false;
    }
    
    return true;
  });
};

// Selector paginado
export const selectPaginatedAlcanceTemplates = (state) => {
  const filtered = selectFilteredAlcanceTemplates(state);
  const { page, pageSize } = state.alcanceTemplates.pagination;
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    items: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
};

export default alcanceTemplatesSlice.reducer;