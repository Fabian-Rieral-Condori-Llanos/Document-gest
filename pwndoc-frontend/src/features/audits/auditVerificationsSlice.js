import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as verificationsApi from '../../api/endpoints/audit-verifications.api';

/**
 * Audit Verifications Slice
 * Estado y acciones para verificación de hallazgos
 */

// ============================================
// ESTADO INICIAL
// ============================================

const initialState = {
  // Lista de verificaciones
  verifications: [],
  loading: false,
  error: null,
  
  // Estadísticas
  stats: null,
  statsLoading: false,
  
  // Verificación seleccionada
  selectedVerification: null,
  selectedLoading: false,
  selectedError: null,
  
  // Estados disponibles
  verificationStatuses: [],
  
  // Filtros
  filters: {
    result: '',
    search: '',
  },
};

// ============================================
// THUNKS
// ============================================

export const fetchAuditVerifications = createAsyncThunk(
  'auditVerifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.getAuditVerifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar verificaciones');
    }
  }
);

export const fetchAuditVerificationById = createAsyncThunk(
  'auditVerifications/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.getAuditVerificationById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar verificación');
    }
  }
);

export const fetchAuditVerificationsByAuditId = createAsyncThunk(
  'auditVerifications/fetchByAuditId',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.getAuditVerificationsByAuditId(auditId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar verificaciones');
    }
  }
);

export const fetchAuditVerificationStats = createAsyncThunk(
  'auditVerifications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.getAuditVerificationStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }
);

export const fetchVerificationStatuses = createAsyncThunk(
  'auditVerifications/fetchStatuses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.getVerificationStatuses();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar estados');
    }
  }
);

export const createAuditVerification = createAsyncThunk(
  'auditVerifications/create',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.createAuditVerification(verificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear verificación');
    }
  }
);

export const updateAuditVerification = createAsyncThunk(
  'auditVerifications/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.updateAuditVerification(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar verificación');
    }
  }
);

export const finalizeAuditVerification = createAsyncThunk(
  'auditVerifications/finalize',
  async (id, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.finalizeAuditVerification(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al finalizar verificación');
    }
  }
);

export const deleteAuditVerification = createAsyncThunk(
  'auditVerifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await verificationsApi.deleteAuditVerification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar verificación');
    }
  }
);

// Findings dentro de verificación
export const updateVerificationFinding = createAsyncThunk(
  'auditVerifications/updateFinding',
  async ({ verificationId, findingId, findingData }, { rejectWithValue }) => {
    try {
      const response = await verificationsApi.updateVerificationFinding(verificationId, findingId, findingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar finding');
    }
  }
);

// ============================================
// SLICE
// ============================================

const auditVerificationsSlice = createSlice({
  name: 'auditVerifications',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedVerification: (state) => {
      state.selectedVerification = null;
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
      .addCase(fetchAuditVerifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditVerifications.fulfilled, (state, action) => {
        state.loading = false;
        state.verifications = action.payload;
      })
      .addCase(fetchAuditVerifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by ID
      .addCase(fetchAuditVerificationById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchAuditVerificationById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedVerification = action.payload;
      })
      .addCase(fetchAuditVerificationById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // Fetch by audit ID
      .addCase(fetchAuditVerificationsByAuditId.fulfilled, (state, action) => {
        // Puede retornar array o single
        state.verifications = Array.isArray(action.payload) ? action.payload : [action.payload];
      })
      
      // Fetch stats
      .addCase(fetchAuditVerificationStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAuditVerificationStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAuditVerificationStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // Fetch statuses
      .addCase(fetchVerificationStatuses.fulfilled, (state, action) => {
        state.verificationStatuses = action.payload;
      })
      
      // Create
      .addCase(createAuditVerification.fulfilled, (state, action) => {
        state.verifications.unshift(action.payload);
      })
      
      // Update
      .addCase(updateAuditVerification.fulfilled, (state, action) => {
        state.selectedVerification = action.payload;
        const index = state.verifications.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.verifications[index] = action.payload;
        }
      })
      
      // Finalize
      .addCase(finalizeAuditVerification.fulfilled, (state, action) => {
        state.selectedVerification = action.payload;
        const index = state.verifications.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
          state.verifications[index] = action.payload;
        }
      })
      
      // Delete
      .addCase(deleteAuditVerification.fulfilled, (state, action) => {
        state.verifications = state.verifications.filter(v => v._id !== action.payload);
      })
      
      // Update finding
      .addCase(updateVerificationFinding.fulfilled, (state, action) => {
        state.selectedVerification = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  clearSelectedVerification,
  clearError,
} = auditVerificationsSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllVerifications = (state) => state.auditVerifications.verifications;
export const selectVerificationsLoading = (state) => state.auditVerifications.loading;
export const selectVerificationsError = (state) => state.auditVerifications.error;

export const selectSelectedVerification = (state) => state.auditVerifications.selectedVerification;
export const selectSelectedVerificationLoading = (state) => state.auditVerifications.selectedLoading;

export const selectVerificationStats = (state) => state.auditVerifications.stats;
export const selectVerificationStatsLoading = (state) => state.auditVerifications.statsLoading;

export const selectVerificationStatuses = (state) => state.auditVerifications.verificationStatuses;
export const selectVerificationFilters = (state) => state.auditVerifications.filters;

// Selector con filtros
export const selectFilteredVerifications = (state) => {
  const { verifications, filters } = state.auditVerifications;
  
  return verifications.filter(verification => {
    if (filters.result && verification.result !== filters.result) {
      return false;
    }
    return true;
  });
};

// ============================================
// CONSTANTES (re-export desde API)
// ============================================

export { 
  VERIFICATION_STATUS, 
  VERIFICATION_RESULT,
  VERIFICATION_STATUS_COLORS, 
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_RESULT_LABELS,
} from '../../api/endpoints/audit-verifications.api';

export default auditVerificationsSlice.reducer;