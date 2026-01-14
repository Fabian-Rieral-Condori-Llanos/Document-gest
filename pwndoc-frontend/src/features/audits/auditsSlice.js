import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as auditsApi from '../../api/endpoints/audits.api';

/**
 * Audits Slice
 * Estado y acciones para gestión de auditorías
 */

// ============================================
// ESTADO INICIAL
// ============================================

const initialState = {
  // Lista de auditorías
  audits: [],
  loading: false,
  error: null,
  
  // Auditoría seleccionada
  selectedAudit: null,
  selectedLoading: false,
  selectedError: null,
  
  // Findings de la auditoría seleccionada
  findings: [],
  findingsLoading: false,
  findingsError: null,
  
  // Secciones de la auditoría seleccionada
  sections: [],
  sectionsLoading: false,
  sectionsError: null,
  
  // Filtros
  filters: {
    search: '',
    state: '',
    type: '',
    company: '',
    creator: '',
  },
  
  // Paginación
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// ============================================
// THUNKS - AUDITORÍAS
// ============================================

export const fetchAudits = createAsyncThunk(
  'audits/fetchAudits',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await auditsApi.getAudits(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar auditorías');
    }
  }
);

export const fetchAuditById = createAsyncThunk(
  'audits/fetchAuditById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await auditsApi.getAuditById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar auditoría');
    }
  }
);

export const createAudit = createAsyncThunk(
  'audits/createAudit',
  async (auditData, { rejectWithValue }) => {
    try {
      const response = await auditsApi.createAudit(auditData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear auditoría');
    }
  }
);

export const deleteAudit = createAsyncThunk(
  'audits/deleteAudit',
  async (id, { rejectWithValue }) => {
    try {
      await auditsApi.deleteAudit(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar auditoría');
    }
  }
);

export const updateAuditGeneral = createAsyncThunk(
  'audits/updateAuditGeneral',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await auditsApi.updateAuditGeneral(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar auditoría');
    }
  }
);

export const updateAuditState = createAsyncThunk(
  'audits/updateAuditState',
  async ({ id, state }, { rejectWithValue }) => {
    try {
      const response = await auditsApi.updateAuditState(id, state);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar estado');
    }
  }
);

// ============================================
// THUNKS - FINDINGS
// ============================================

export const fetchAuditFindings = createAsyncThunk(
  'audits/fetchAuditFindings',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await auditsApi.getAuditFindings(auditId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar findings');
    }
  }
);

export const createAuditFinding = createAsyncThunk(
  'audits/createAuditFinding',
  async ({ auditId, findingData }, { rejectWithValue }) => {
    try {
      const response = await auditsApi.createAuditFinding(auditId, findingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear finding');
    }
  }
);

export const updateAuditFinding = createAsyncThunk(
  'audits/updateAuditFinding',
  async ({ auditId, findingId, findingData }, { rejectWithValue }) => {
    try {
      const response = await auditsApi.updateAuditFinding(auditId, findingId, findingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar finding');
    }
  }
);

export const deleteAuditFinding = createAsyncThunk(
  'audits/deleteAuditFinding',
  async ({ auditId, findingId }, { rejectWithValue }) => {
    try {
      await auditsApi.deleteAuditFinding(auditId, findingId);
      return findingId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar finding');
    }
  }
);

// ============================================
// THUNKS - SECTIONS
// ============================================

export const fetchAuditSections = createAsyncThunk(
  'audits/fetchAuditSections',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await auditsApi.getAuditSections(auditId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar secciones');
    }
  }
);

// ============================================
// SLICE
// ============================================

const auditsSlice = createSlice({
  name: 'audits',
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
    clearSelectedAudit: (state) => {
      state.selectedAudit = null;
      state.selectedError = null;
      state.findings = [];
      state.sections = [];
    },
    
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
      state.selectedError = null;
      state.findingsError = null;
      state.sectionsError = null;
    },
    
    // Paginación
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH AUDITS
      // ============================================
      .addCase(fetchAudits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAudits.fulfilled, (state, action) => {
        state.loading = false;
        state.audits = action.payload;
      })
      .addCase(fetchAudits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // FETCH AUDIT BY ID
      // ============================================
      .addCase(fetchAuditById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchAuditById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedAudit = action.payload;
      })
      .addCase(fetchAuditById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // ============================================
      // CREATE AUDIT
      // ============================================
      .addCase(createAudit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAudit.fulfilled, (state, action) => {
        state.loading = false;
        state.audits.unshift(action.payload);
      })
      .addCase(createAudit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // DELETE AUDIT
      // ============================================
      .addCase(deleteAudit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAudit.fulfilled, (state, action) => {
        state.loading = false;
        state.audits = state.audits.filter(a => a._id !== action.payload);
      })
      .addCase(deleteAudit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // UPDATE AUDIT GENERAL
      // ============================================
      .addCase(updateAuditGeneral.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(updateAuditGeneral.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedAudit = action.payload;
        // Actualizar en lista
        const index = state.audits.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.audits[index] = action.payload;
        }
      })
      .addCase(updateAuditGeneral.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      
      // ============================================
      // UPDATE AUDIT STATE
      // ============================================
      .addCase(updateAuditState.fulfilled, (state, action) => {
        if (state.selectedAudit?._id === action.payload._id) {
          state.selectedAudit = action.payload;
        }
        const index = state.audits.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.audits[index] = action.payload;
        }
      })
      
      // ============================================
      // FETCH FINDINGS
      // ============================================
      .addCase(fetchAuditFindings.pending, (state) => {
        state.findingsLoading = true;
        state.findingsError = null;
      })
      .addCase(fetchAuditFindings.fulfilled, (state, action) => {
        state.findingsLoading = false;
        state.findings = action.payload;
      })
      .addCase(fetchAuditFindings.rejected, (state, action) => {
        state.findingsLoading = false;
        state.findingsError = action.payload;
      })
      
      // ============================================
      // CREATE FINDING
      // ============================================
      .addCase(createAuditFinding.fulfilled, (state, action) => {
        state.findings.push(action.payload);
      })
      
      // ============================================
      // UPDATE FINDING
      // ============================================
      .addCase(updateAuditFinding.fulfilled, (state, action) => {
        const index = state.findings.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.findings[index] = action.payload;
        }
      })
      
      // ============================================
      // DELETE FINDING
      // ============================================
      .addCase(deleteAuditFinding.fulfilled, (state, action) => {
        state.findings = state.findings.filter(f => f._id !== action.payload);
      })
      
      // ============================================
      // FETCH SECTIONS
      // ============================================
      .addCase(fetchAuditSections.pending, (state) => {
        state.sectionsLoading = true;
        state.sectionsError = null;
      })
      .addCase(fetchAuditSections.fulfilled, (state, action) => {
        state.sectionsLoading = false;
        state.sections = action.payload;
      })
      .addCase(fetchAuditSections.rejected, (state, action) => {
        state.sectionsLoading = false;
        state.sectionsError = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  setFilters,
  clearFilters,
  clearSelectedAudit,
  clearError,
  setPage,
  setLimit,
} = auditsSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAllAudits = (state) => state.audits.audits;
export const selectAuditsLoading = (state) => state.audits.loading;
export const selectAuditsError = (state) => state.audits.error;

export const selectSelectedAudit = (state) => state.audits.selectedAudit;
export const selectSelectedAuditLoading = (state) => state.audits.selectedLoading;
export const selectSelectedAuditError = (state) => state.audits.selectedError;

export const selectAuditFindings = (state) => state.audits.findings;
export const selectFindingsLoading = (state) => state.audits.findingsLoading;
export const selectFindingsError = (state) => state.audits.findingsError;

export const selectAuditSections = (state) => state.audits.sections;
export const selectSectionsLoading = (state) => state.audits.sectionsLoading;

export const selectAuditsFilters = (state) => state.audits.filters;
export const selectAuditsPagination = (state) => state.audits.pagination;

// Selector con filtros aplicados
export const selectFilteredAudits = (state) => {
  const { audits, filters } = state.audits;
  
  return audits.filter(audit => {
    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchName = audit.name?.toLowerCase().includes(searchLower);
      const matchType = audit.auditType?.toLowerCase().includes(searchLower);
      if (!matchName && !matchType) return false;
    }
    
    // Filtro de estado
    if (filters.state && audit.state !== filters.state) {
      return false;
    }
    
    // Filtro de tipo
    if (filters.type && audit.type !== filters.type) {
      return false;
    }
    
    // Filtro de empresa
    if (filters.company) {
      const companyId = typeof audit.company === 'object' ? audit.company?._id : audit.company;
      if (companyId !== filters.company) return false;
    }
    
    return true;
  });
};

// ============================================
// CONSTANTES
// ============================================

export const AUDIT_STATES = {
  EDIT: 'EDIT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
};

export const AUDIT_TYPES = {
  DEFAULT: 'default',
  MULTI: 'multi',
  RETEST: 'retest',
};

export const AUDIT_STATE_LABELS = {
  EDIT: 'En Edición',
  REVIEW: 'En Revisión',
  APPROVED: 'Aprobada',
};

export const AUDIT_TYPE_LABELS = {
  default: 'Estándar',
  multi: 'Multi-auditoría',
  retest: 'Retest',
};

export const AUDIT_STATE_COLORS = {
  EDIT: { bg: 'bg-info-500/10', text: 'text-info-400', border: 'border-info-500/20' },
  REVIEW: { bg: 'bg-warning-500/10', text: 'text-warning-400', border: 'border-warning-500/20' },
  APPROVED: { bg: 'bg-success-500/10', text: 'text-success-400', border: 'border-success-500/20' },
};

export default auditsSlice.reducer;