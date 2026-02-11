import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import procedureTemplatesApi from '../../api/endpoints/procedure-templates.api';

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Obtener todas las plantillas
 */
export const fetchProcedureTemplates = createAsyncThunk(
  'procedureTemplates/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching procedure templates');
    }
  }
);

/**
 * Obtener solo plantillas activas
 */
export const fetchActiveProcedureTemplates = createAsyncThunk(
  'procedureTemplates/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.getActive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching active templates');
    }
  }
);

/**
 * Obtener estadísticas
 */
export const fetchProcedureTemplateStats = createAsyncThunk(
  'procedureTemplates/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching stats');
    }
  }
);

/**
 * Obtener plantilla por ID
 */
export const fetchProcedureTemplateById = createAsyncThunk(
  'procedureTemplates/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error fetching procedure template');
    }
  }
);

/**
 * Crear plantilla
 */
export const createProcedureTemplate = createAsyncThunk(
  'procedureTemplates/create',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.create(templateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error creating procedure template');
    }
  }
);

/**
 * Actualizar plantilla
 */
export const updateProcedureTemplate = createAsyncThunk(
  'procedureTemplates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error updating procedure template');
    }
  }
);

/**
 * Activar/desactivar plantilla
 */
export const toggleProcedureTemplate = createAsyncThunk(
  'procedureTemplates/toggle',
  async (id, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.toggle(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error toggling procedure template');
    }
  }
);

/**
 * Eliminar plantilla
 */
export const deleteProcedureTemplate = createAsyncThunk(
  'procedureTemplates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await procedureTemplatesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error deleting procedure template');
    }
  }
);

/**
 * Inicializar plantillas por defecto
 */
export const initializeProcedureTemplates = createAsyncThunk(
  'procedureTemplates/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await procedureTemplatesApi.initialize();
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
  
  // Estado de operaciones
  operationLoading: false,
  operationError: null,
  operationSuccess: null,
};

// ============================================
// SLICE
// ============================================

const procedureTemplatesSlice = createSlice({
  name: 'procedureTemplates',
  initialState,
  reducers: {
    // Filtros
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
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
      .addCase(fetchProcedureTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchProcedureTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchProcedureTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload;
      })
      
      // Fetch active
      .addCase(fetchActiveProcedureTemplates.pending, (state) => {
        state.activeTemplatesLoading = true;
      })
      .addCase(fetchActiveProcedureTemplates.fulfilled, (state, action) => {
        state.activeTemplatesLoading = false;
        state.activeTemplates = action.payload;
      })
      .addCase(fetchActiveProcedureTemplates.rejected, (state) => {
        state.activeTemplatesLoading = false;
      })
      
      // Fetch stats
      .addCase(fetchProcedureTemplateStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchProcedureTemplateStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchProcedureTemplateStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch by ID
      .addCase(fetchProcedureTemplateById.pending, (state) => {
        state.selectedTemplateLoading = true;
        state.selectedTemplateError = null;
      })
      .addCase(fetchProcedureTemplateById.fulfilled, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchProcedureTemplateById.rejected, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplateError = action.payload;
      })
      
      // Create
      .addCase(createProcedureTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(createProcedureTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla creada exitosamente';
        state.templates.push(action.payload);
      })
      .addCase(createProcedureTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update
      .addCase(updateProcedureTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(updateProcedureTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla actualizada exitosamente';
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.selectedTemplate?._id === action.payload._id) {
          state.selectedTemplate = action.payload;
        }
      })
      .addCase(updateProcedureTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Toggle
      .addCase(toggleProcedureTemplate.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(toggleProcedureTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = `Plantilla ${action.payload.isActive ? 'activada' : 'desactivada'}`;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(toggleProcedureTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Delete
      .addCase(deleteProcedureTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(deleteProcedureTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla eliminada exitosamente';
        state.templates = state.templates.filter(t => t._id !== action.payload);
      })
      .addCase(deleteProcedureTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Initialize
      .addCase(initializeProcedureTemplates.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(initializeProcedureTemplates.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = action.payload.message;
        // Agregar los nuevos templates creados
        if (action.payload.created?.length > 0) {
          state.templates.push(...action.payload.created);
        }
      })
      .addCase(initializeProcedureTemplates.rejected, (state, action) => {
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
  clearSelectedTemplate,
  clearError,
  clearOperationState,
} = procedureTemplatesSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllProcedureTemplates = (state) => state.procedureTemplates.templates;
export const selectProcedureTemplatesLoading = (state) => state.procedureTemplates.templatesLoading;
export const selectProcedureTemplatesError = (state) => state.procedureTemplates.templatesError;

export const selectActiveProcedureTemplates = (state) => state.procedureTemplates.activeTemplates;
export const selectActiveProcedureTemplatesLoading = (state) => state.procedureTemplates.activeTemplatesLoading;

export const selectSelectedProcedureTemplate = (state) => state.procedureTemplates.selectedTemplate;
export const selectSelectedProcedureTemplateLoading = (state) => state.procedureTemplates.selectedTemplateLoading;
export const selectSelectedProcedureTemplateError = (state) => state.procedureTemplates.selectedTemplateError;

export const selectProcedureTemplateStats = (state) => state.procedureTemplates.stats;
export const selectProcedureTemplateStatsLoading = (state) => state.procedureTemplates.statsLoading;

export const selectProcedureTemplateFilters = (state) => state.procedureTemplates.filters;

export const selectProcedureTemplateOperationLoading = (state) => state.procedureTemplates.operationLoading;
export const selectProcedureTemplateOperationError = (state) => state.procedureTemplates.operationError;
export const selectProcedureTemplateOperationSuccess = (state) => state.procedureTemplates.operationSuccess;

// Selector filtrado
export const selectFilteredProcedureTemplates = (state) => {
  const { templates, filters } = state.procedureTemplates;
  
  return templates.filter(template => {
    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        template.name?.toLowerCase().includes(search) ||
        template.code?.toLowerCase().includes(search) ||
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

export default procedureTemplatesSlice.reducer;
