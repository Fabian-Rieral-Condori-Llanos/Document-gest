import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as auditStatusApi from '../../api/endpoints/audit-status.api';

/**
 * Audit Status Slice
 * Estado y acciones para seguimiento de auditorías
 */

// ============================================
// ESTADO INICIAL
// ============================================

const initialState = {
  // Lista de estados
  statuses: [],
  loading: false,
  error: null,
  
  // Estadísticas
  stats: null,
  statsLoading: false,
  
  // Estado seleccionado (por auditoría)
  selectedStatus: null,
  selectedLoading: false,
  selectedError: null,
  
  // Historial
  history: [],
  historyLoading: false,
  
  // Tipos disponibles
  statusTypes: [],
  
  // Filtros
  filters: {
    status: '',
    search: '',
  },
};

// ============================================
// THUNKS
// ============================================

export const fetchAuditStatuses = createAsyncThunk(
  'auditStatus/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.getAuditStatuses(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estados');
    }
  }
);

export const fetchAuditStatusByAuditId = createAsyncThunk(
  'auditStatus/fetchByAuditId',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.getAuditStatusByAuditId(auditId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estado');
    }
  }
);

export const fetchAuditStatusHistory = createAsyncThunk(
  'auditStatus/fetchHistory',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.getAuditStatusHistory(auditId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar historial');
    }
  }
);

export const fetchAuditStatusStats = createAsyncThunk(
  'auditStatus/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.getAuditStatusStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }
);

export const fetchAuditStatusTypes = createAsyncThunk(
  'auditStatus/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.getAuditStatusTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar tipos');
    }
  }
);

export const createAuditStatus = createAsyncThunk(
  'auditStatus/create',
  async (statusData, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.createAuditStatus(statusData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear estado');
    }
  }
);

export const updateAuditStatusByAuditId = createAsyncThunk(
  'auditStatus/updateByAuditId',
  async ({ auditId, statusData }, { rejectWithValue }) => {
    try {
      const response = await auditStatusApi.updateAuditStatusByAuditId(auditId, statusData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar estado');
    }
  }
);

export const deleteAuditStatus = createAsyncThunk(
  'auditStatus/delete',
  async (id, { rejectWithValue }) => {
    try {
      await auditStatusApi.deleteAuditStatus(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar estado');
    }
  }
);

// ============================================
// SLICE
// ============================================

const auditStatusSlice = createSlice({
  name: 'auditStatus',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedStatus: (state) => {
      state.selectedStatus = null;
      state.selectedError = null;
      state.history = [];
    },
    clearError: (state) => {
      state.error = null;
      state.selectedError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAuditStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.statuses = action.payload;
      })
      .addCase(fetchAuditStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by audit ID
      .addCase(fetchAuditStatusByAuditId.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchAuditStatusByAuditId.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedStatus = action.payload;
      })
      .addCase(fetchAuditStatusByAuditId.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // Fetch history
      .addCase(fetchAuditStatusHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAuditStatusHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchAuditStatusHistory.rejected, (state) => {
        state.historyLoading = false;
      })
      
      // Fetch stats
      .addCase(fetchAuditStatusStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAuditStatusStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAuditStatusStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch types
      .addCase(fetchAuditStatusTypes.fulfilled, (state, action) => {
        state.statusTypes = action.payload;
      })
      
      // Create
      .addCase(createAuditStatus.fulfilled, (state, action) => {
        state.statuses.unshift(action.payload);
      })
      
      // Update
      .addCase(updateAuditStatusByAuditId.fulfilled, (state, action) => {
        state.selectedStatus = action.payload;
        const index = state.statuses.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.statuses[index] = action.payload;
        }
      })
      
      // Delete
      .addCase(deleteAuditStatus.fulfilled, (state, action) => {
        state.statuses = state.statuses.filter(s => s._id !== action.payload);
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  clearSelectedStatus,
  clearError,
} = auditStatusSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllAuditStatuses = (state) => state.auditStatus.statuses;
export const selectAuditStatusLoading = (state) => state.auditStatus.loading;
export const selectAuditStatusError = (state) => state.auditStatus.error;

export const selectSelectedAuditStatus = (state) => state.auditStatus.selectedStatus;
export const selectSelectedAuditStatusLoading = (state) => state.auditStatus.selectedLoading;

export const selectAuditStatusStats = (state) => state.auditStatus.stats;
export const selectAuditStatusStatsLoading = (state) => state.auditStatus.statsLoading;

export const selectAuditStatusHistory = (state) => state.auditStatus.history;
export const selectAuditStatusHistoryLoading = (state) => state.auditStatus.historyLoading;

export const selectAuditStatusTypes = (state) => state.auditStatus.statusTypes;
export const selectAuditStatusFilters = (state) => state.auditStatus.filters;

// Selector con filtros
export const selectFilteredAuditStatuses = (state) => {
  const { statuses, filters } = state.auditStatus;
  
  return statuses.filter(status => {
    if (filters.status && status.status !== filters.status) {
      return false;
    }
    return true;
  });
};

// ============================================
// CONSTANTES (re-export desde API)
// ============================================

export { 
  AUDIT_STATUS_TYPES, 
  AUDIT_STATUS_COLORS, 
  AUDIT_STATUS_LABELS 
} from '../../api/endpoints/audit-status.api';

export default auditStatusSlice.reducer;