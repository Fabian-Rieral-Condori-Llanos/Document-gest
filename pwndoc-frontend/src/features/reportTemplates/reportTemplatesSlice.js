import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportTemplatesApi from '../../api/endpoints/report-templates.api';
import dataSchemasApi from '../../api/endpoints/data-schemas.api';

// ============================================
// ASYNC THUNKS - REPORT TEMPLATES
// ============================================

export const fetchReportTemplates = createAsyncThunk(
  'reportTemplates/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener plantillas');
    }
  }
);

export const fetchActiveReportTemplates = createAsyncThunk(
  'reportTemplates/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.getActive();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener plantillas activas');
    }
  }
);

export const fetchReportTemplateStats = createAsyncThunk(
  'reportTemplates/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener estadísticas');
    }
  }
);

export const fetchReportTemplateById = createAsyncThunk(
  'reportTemplates/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener plantilla');
    }
  }
);

export const fetchReportTemplateCategories = createAsyncThunk(
  'reportTemplates/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener categorías');
    }
  }
);

export const createReportTemplate = createAsyncThunk(
  'reportTemplates/create',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.create(templateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear plantilla');
    }
  }
);

export const createReportTemplateFromDocx = createAsyncThunk(
  'reportTemplates/createFromDocx',
  async ({ file, metadata }, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.createFromDocx(file, metadata);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear plantilla desde DOCX');
    }
  }
);

export const updateReportTemplate = createAsyncThunk(
  'reportTemplates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar plantilla');
    }
  }
);

export const updateReportTemplateContent = createAsyncThunk(
  'reportTemplates/updateContent',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.updateContent(id, content);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar contenido');
    }
  }
);

export const toggleReportTemplate = createAsyncThunk(
  'reportTemplates/toggle',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.toggle(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al cambiar estado');
    }
  }
);

export const cloneReportTemplate = createAsyncThunk(
  'reportTemplates/clone',
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.clone(id, name);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al clonar plantilla');
    }
  }
);

export const deleteReportTemplate = createAsyncThunk(
  'reportTemplates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await reportTemplatesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar plantilla');
    }
  }
);

export const initializeReportTemplates = createAsyncThunk(
  'reportTemplates/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportTemplatesApi.initialize();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al inicializar plantillas');
    }
  }
);

// ============================================
// ASYNC THUNKS - DATA SCHEMAS
// ============================================

export const fetchDataSchemas = createAsyncThunk(
  'reportTemplates/fetchDataSchemas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataSchemasApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener esquemas');
    }
  }
);

export const fetchDataSchemaList = createAsyncThunk(
  'reportTemplates/fetchDataSchemaList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataSchemasApi.getList();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener lista de esquemas');
    }
  }
);

export const fetchSampleData = createAsyncThunk(
  'reportTemplates/fetchSampleData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataSchemasApi.getSampleData();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener datos de ejemplo');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Lista de plantillas
  templates: [],
  templatesLoading: false,
  templatesError: null,
  
  // Plantillas activas (para selectores)
  activeTemplates: [],
  activeTemplatesLoading: false,
  
  // Plantilla seleccionada (para edición)
  selectedTemplate: null,
  selectedTemplateLoading: false,
  selectedTemplateError: null,
  
  // Estadísticas
  stats: null,
  statsLoading: false,
  
  // Categorías
  categories: [],
  categoriesLoading: false,
  
  // Esquemas de datos (para el constructor visual)
  dataSchemas: {},
  dataSchemaList: [],
  dataSchemasLoading: false,
  
  // Datos de ejemplo (para preview)
  sampleData: null,
  sampleDataLoading: false,
  
  // Filtros
  filters: {
    search: '',
    category: '',
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

const reportTemplatesSlice = createSlice({
  name: 'reportTemplates',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.page = 1;
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
      state.selectedTemplateError = null;
    },
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    updateSelectedTemplateContent: (state, action) => {
      if (state.selectedTemplate) {
        state.selectedTemplate.content = action.payload;
      }
    },
    clearError: (state) => {
      state.templatesError = null;
      state.selectedTemplateError = null;
      state.operationError = null;
    },
    clearOperationState: (state) => {
      state.operationLoading = false;
      state.operationError = null;
      state.operationSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all templates
      .addCase(fetchReportTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchReportTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload;
      })
      
      // Fetch active templates
      .addCase(fetchActiveReportTemplates.pending, (state) => {
        state.activeTemplatesLoading = true;
      })
      .addCase(fetchActiveReportTemplates.fulfilled, (state, action) => {
        state.activeTemplatesLoading = false;
        state.activeTemplates = action.payload;
      })
      .addCase(fetchActiveReportTemplates.rejected, (state) => {
        state.activeTemplatesLoading = false;
      })
      
      // Fetch stats
      .addCase(fetchReportTemplateStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchReportTemplateStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchReportTemplateStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch by ID
      .addCase(fetchReportTemplateById.pending, (state) => {
        state.selectedTemplateLoading = true;
        state.selectedTemplateError = null;
      })
      .addCase(fetchReportTemplateById.fulfilled, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchReportTemplateById.rejected, (state, action) => {
        state.selectedTemplateLoading = false;
        state.selectedTemplateError = action.payload;
      })
      
      // Fetch categories
      .addCase(fetchReportTemplateCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchReportTemplateCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchReportTemplateCategories.rejected, (state) => {
        state.categoriesLoading = false;
      })
      
      // Create
      .addCase(createReportTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(createReportTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla creada exitosamente';
        state.templates.push(action.payload);
      })
      .addCase(createReportTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Create from DOCX
      .addCase(createReportTemplateFromDocx.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createReportTemplateFromDocx.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla importada exitosamente';
        state.templates.push(action.payload);
      })
      .addCase(createReportTemplateFromDocx.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update
      .addCase(updateReportTemplate.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(updateReportTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla actualizada';
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.selectedTemplate?._id === action.payload._id) {
          state.selectedTemplate = action.payload;
        }
      })
      .addCase(updateReportTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update content
      .addCase(updateReportTemplateContent.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateReportTemplateContent.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Contenido guardado';
      })
      .addCase(updateReportTemplateContent.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Toggle
      .addCase(toggleReportTemplate.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(toggleReportTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = `Plantilla ${action.payload.isActive ? 'activada' : 'desactivada'}`;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(toggleReportTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Clone
      .addCase(cloneReportTemplate.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(cloneReportTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla clonada exitosamente';
        state.templates.push(action.payload);
      })
      .addCase(cloneReportTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Delete
      .addCase(deleteReportTemplate.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deleteReportTemplate.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Plantilla eliminada';
        state.templates = state.templates.filter(t => t._id !== action.payload);
      })
      .addCase(deleteReportTemplate.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Initialize
      .addCase(initializeReportTemplates.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(initializeReportTemplates.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = action.payload.message;
        if (action.payload.created?.length > 0) {
          state.templates.push(...action.payload.created);
        }
      })
      .addCase(initializeReportTemplates.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Fetch data schemas
      .addCase(fetchDataSchemas.pending, (state) => {
        state.dataSchemasLoading = true;
      })
      .addCase(fetchDataSchemas.fulfilled, (state, action) => {
        state.dataSchemasLoading = false;
        state.dataSchemas = action.payload;
      })
      .addCase(fetchDataSchemas.rejected, (state) => {
        state.dataSchemasLoading = false;
      })
      
      // Fetch data schema list
      .addCase(fetchDataSchemaList.fulfilled, (state, action) => {
        state.dataSchemaList = action.payload;
      })
      
      // Fetch sample data
      .addCase(fetchSampleData.pending, (state) => {
        state.sampleDataLoading = true;
      })
      .addCase(fetchSampleData.fulfilled, (state, action) => {
        state.sampleDataLoading = false;
        state.sampleData = action.payload;
      })
      .addCase(fetchSampleData.rejected, (state) => {
        state.sampleDataLoading = false;
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
  setSelectedTemplate,
  updateSelectedTemplateContent,
  clearError,
  clearOperationState,
} = reportTemplatesSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllReportTemplates = (state) => state.reportTemplates.templates;
export const selectReportTemplatesLoading = (state) => state.reportTemplates.templatesLoading;
export const selectReportTemplatesError = (state) => state.reportTemplates.templatesError;

export const selectActiveReportTemplates = (state) => state.reportTemplates.activeTemplates;
export const selectActiveReportTemplatesLoading = (state) => state.reportTemplates.activeTemplatesLoading;

export const selectSelectedReportTemplate = (state) => state.reportTemplates.selectedTemplate;
export const selectSelectedReportTemplateLoading = (state) => state.reportTemplates.selectedTemplateLoading;
export const selectSelectedReportTemplateError = (state) => state.reportTemplates.selectedTemplateError;

export const selectReportTemplateStats = (state) => state.reportTemplates.stats;
export const selectReportTemplateStatsLoading = (state) => state.reportTemplates.statsLoading;

export const selectReportTemplateCategories = (state) => state.reportTemplates.categories;

export const selectDataSchemas = (state) => state.reportTemplates.dataSchemas;
export const selectDataSchemaList = (state) => state.reportTemplates.dataSchemaList;
export const selectDataSchemasLoading = (state) => state.reportTemplates.dataSchemasLoading;

export const selectSampleData = (state) => state.reportTemplates.sampleData;
export const selectSampleDataLoading = (state) => state.reportTemplates.sampleDataLoading;

export const selectReportTemplateFilters = (state) => state.reportTemplates.filters;
export const selectReportTemplatePagination = (state) => state.reportTemplates.pagination;

export const selectReportTemplateOperationLoading = (state) => state.reportTemplates.operationLoading;
export const selectReportTemplateOperationError = (state) => state.reportTemplates.operationError;
export const selectReportTemplateOperationSuccess = (state) => state.reportTemplates.operationSuccess;

// Selector filtrado
export const selectFilteredReportTemplates = (state) => {
  const { templates, filters } = state.reportTemplates;
  
  return templates.filter(template => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        template.name?.toLowerCase().includes(search) ||
        template.description?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    if (filters.category && template.category !== filters.category) {
      return false;
    }
    
    if (filters.isActive !== undefined && template.isActive !== filters.isActive) {
      return false;
    }
    
    return true;
  });
};

export default reportTemplatesSlice.reducer;
