import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as proceduresApi from '../../api/endpoints/audit-procedures.api';

/**
 * Audit Procedures Slice
 * Estado y acciones para documentación de procedimientos
 */

// ============================================
// ESTADO INICIAL
// ============================================

const initialState = {
  // Lista de procedimientos
  procedures: [],
  loading: false,
  error: null,
  
  // Estadísticas
  stats: null,
  statsLoading: false,
  
  // Procedimiento seleccionado
  selectedProcedure: null,
  selectedLoading: false,
  selectedError: null,
  
  // Tipos de alcance
  alcanceTipos: [],
  
  // Filtros
  filters: {
    origen: '',
    alcance: '',
    search: '',
  },
};

// ============================================
// THUNKS
// ============================================

export const fetchAuditProcedures = createAsyncThunk(
  'auditProcedures/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.getAuditProcedures(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar procedimientos');
    }
  }
);

export const fetchAuditProcedureById = createAsyncThunk(
  'auditProcedures/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.getAuditProcedureById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar procedimiento');
    }
  }
);

export const fetchAuditProcedureByAuditId = createAsyncThunk(
  'auditProcedures/fetchByAuditId',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.getAuditProcedureByAuditId(auditId);
      return response.data;
    } catch (error) {
      // Si no existe, no es un error crítico
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || 'Error al cargar procedimiento');
    }
  }
);

export const fetchAuditProcedureStats = createAsyncThunk(
  'auditProcedures/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.getAuditProcedureStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }
);

export const fetchAlcanceTipos = createAsyncThunk(
  'auditProcedures/fetchAlcanceTipos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.getAlcanceTipos();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar tipos de alcance');
    }
  }
);

export const searchAuditProcedures = createAsyncThunk(
  'auditProcedures/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.searchAuditProcedures(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error en búsqueda');
    }
  }
);

export const createAuditProcedure = createAsyncThunk(
  'auditProcedures/create',
  async (procedureData, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.createAuditProcedure(procedureData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear procedimiento');
    }
  }
);

export const updateAuditProcedure = createAsyncThunk(
  'auditProcedures/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateAuditProcedure(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar procedimiento');
    }
  }
);

export const updateAuditProcedureByAuditId = createAsyncThunk(
  'auditProcedures/updateByAuditId',
  async ({ auditId, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateAuditProcedureByAuditId(auditId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar procedimiento');
    }
  }
);

export const deleteAuditProcedure = createAsyncThunk(
  'auditProcedures/delete',
  async (id, { rejectWithValue }) => {
    try {
      await proceduresApi.deleteAuditProcedure(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar procedimiento');
    }
  }
);

// Secciones específicas
export const updateProcedureSolicitud = createAsyncThunk(
  'auditProcedures/updateSolicitud',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureSolicitud(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar solicitud');
    }
  }
);

export const updateProcedureInstructivo = createAsyncThunk(
  'auditProcedures/updateInstructivo',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureInstructivo(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar instructivo');
    }
  }
);

export const updateProcedureInforme = createAsyncThunk(
  'auditProcedures/updateInforme',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureInforme(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar informe');
    }
  }
);

export const updateProcedureRespuesta = createAsyncThunk(
  'auditProcedures/updateRespuesta',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureRespuesta(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar respuesta');
    }
  }
);

export const updateProcedureNotas = createAsyncThunk(
  'auditProcedures/updateNotas',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureNotas(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar notas');
    }
  }
);

export const updateProcedureRetest = createAsyncThunk(
  'auditProcedures/updateRetest',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await proceduresApi.updateProcedureRetest(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar retest');
    }
  }
);

// ============================================
// SLICE
// ============================================

const auditProceduresSlice = createSlice({
  name: 'auditProcedures',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedProcedure: (state) => {
      state.selectedProcedure = null;
      state.selectedError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.selectedError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAuditProcedures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditProcedures.fulfilled, (state, action) => {
        state.loading = false;
        state.procedures = action.payload;
      })
      .addCase(fetchAuditProcedures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by ID
      .addCase(fetchAuditProcedureById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchAuditProcedureById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedProcedure = action.payload;
      })
      .addCase(fetchAuditProcedureById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // Fetch by audit ID
      .addCase(fetchAuditProcedureByAuditId.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchAuditProcedureByAuditId.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedProcedure = action.payload;
      })
      .addCase(fetchAuditProcedureByAuditId.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // Fetch stats
      .addCase(fetchAuditProcedureStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAuditProcedureStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAuditProcedureStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch alcance tipos
      .addCase(fetchAlcanceTipos.fulfilled, (state, action) => {
        state.alcanceTipos = action.payload;
      })
      
      // Search
      .addCase(searchAuditProcedures.fulfilled, (state, action) => {
        state.procedures = action.payload;
      })
      
      // Create
      .addCase(createAuditProcedure.fulfilled, (state, action) => {
        state.procedures.unshift(action.payload);
      })
      
      // Update
      .addCase(updateAuditProcedure.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
        const index = state.procedures.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.procedures[index] = action.payload;
        }
      })
      
      // Update by audit ID
      .addCase(updateAuditProcedureByAuditId.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
        const index = state.procedures.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.procedures[index] = action.payload;
        } else {
          state.procedures.unshift(action.payload);
        }
      })
      
      // Delete
      .addCase(deleteAuditProcedure.fulfilled, (state, action) => {
        state.procedures = state.procedures.filter(p => p._id !== action.payload);
      })
      
      // Update sections - todas actualizan el procedimiento seleccionado
      .addCase(updateProcedureSolicitud.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      })
      .addCase(updateProcedureInstructivo.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      })
      .addCase(updateProcedureInforme.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      })
      .addCase(updateProcedureRespuesta.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      })
      .addCase(updateProcedureNotas.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      })
      .addCase(updateProcedureRetest.fulfilled, (state, action) => {
        state.selectedProcedure = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  clearSelectedProcedure,
  clearError,
} = auditProceduresSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllProcedures = (state) => state.auditProcedures.procedures;
export const selectProceduresLoading = (state) => state.auditProcedures.loading;
export const selectProceduresError = (state) => state.auditProcedures.error;

export const selectSelectedProcedure = (state) => state.auditProcedures.selectedProcedure;
export const selectSelectedProcedureLoading = (state) => state.auditProcedures.selectedLoading;

export const selectProcedureStats = (state) => state.auditProcedures.stats;
export const selectProcedureStatsLoading = (state) => state.auditProcedures.statsLoading;

export const selectAlcanceTipos = (state) => state.auditProcedures.alcanceTipos;
export const selectProcedureFilters = (state) => state.auditProcedures.filters;

// Selector con filtros
export const selectFilteredProcedures = (state) => {
  const { procedures, filters } = state.auditProcedures;
  
  return procedures.filter(procedure => {
    // Filtro de origen
    if (filters.origen) {
      const searchLower = filters.origen.toLowerCase();
      if (!procedure.origen?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Filtro de alcance
    if (filters.alcance && procedure.alcance) {
      if (!procedure.alcance.includes(filters.alcance)) {
        return false;
      }
    }
    
    return true;
  });
};

// ============================================
// CONSTANTES (re-export desde API)
// ============================================

export { 
  ALCANCE_TIPOS, 
  ALCANCE_LABELS, 
  ALCANCE_COLORS,
  DOCUMENT_SECTIONS,
} from '../../api/endpoints/audit-procedures.api';

export default auditProceduresSlice.reducer;