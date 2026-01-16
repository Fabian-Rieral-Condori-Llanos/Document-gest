import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportInstancesApi from '../../api/endpoints/report-instances.api';
import pdfApi, { downloadBlob } from '../../api/endpoints/pdf.api';

// ============================================
// ASYNC THUNKS - REPORT INSTANCES
// ============================================

export const fetchReportInstanceByAuditId = createAsyncThunk(
  'reportInstances/fetchByAuditId',
  async (auditId, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.getByAuditId(auditId);
      return response.data;
    } catch (error) {
      // 404 es válido (no existe instancia)
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.data || 'Error al obtener instancia');
    }
  }
);

export const fetchReportInstanceById = createAsyncThunk(
  'reportInstances/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener instancia');
    }
  }
);

export const createReportInstance = createAsyncThunk(
  'reportInstances/create',
  async ({ auditId, templateId }, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.create({ auditId, templateId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear instancia');
    }
  }
);

export const refreshReportInstanceData = createAsyncThunk(
  'reportInstances/refreshData',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.refreshData(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al refrescar datos');
    }
  }
);

export const updateReportInstanceContent = createAsyncThunk(
  'reportInstances/updateContent',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.updateContent(id, content);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar contenido');
    }
  }
);

export const saveReportInstanceVersion = createAsyncThunk(
  'reportInstances/saveVersion',
  async ({ id, comment }, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.saveVersion(id, comment);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al guardar versión');
    }
  }
);

export const fetchReportInstanceVersionHistory = createAsyncThunk(
  'reportInstances/fetchVersionHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.getVersionHistory(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener historial');
    }
  }
);

export const restoreReportInstanceVersion = createAsyncThunk(
  'reportInstances/restoreVersion',
  async ({ id, versionNumber }, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.restoreVersion(id, versionNumber);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al restaurar versión');
    }
  }
);

export const updateReportInstanceStatus = createAsyncThunk(
  'reportInstances/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.updateStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar estado');
    }
  }
);

export const lockReportInstance = createAsyncThunk(
  'reportInstances/lock',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.lock(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al bloquear reporte');
    }
  }
);

export const unlockReportInstance = createAsyncThunk(
  'reportInstances/unlock',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportInstancesApi.unlock(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al desbloquear reporte');
    }
  }
);

export const deleteReportInstance = createAsyncThunk(
  'reportInstances/delete',
  async (id, { rejectWithValue }) => {
    try {
      await reportInstancesApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar instancia');
    }
  }
);

// ============================================
// ASYNC THUNKS - PDF
// ============================================

export const generatePDF = createAsyncThunk(
  'reportInstances/generatePDF',
  async ({ reportInstanceId, options = {}, filename = 'report.pdf' }, { rejectWithValue }) => {
    try {
      const blob = await pdfApi.generate(reportInstanceId, options);
      downloadBlob(blob, filename);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al generar PDF');
    }
  }
);

export const generateAndSavePDF = createAsyncThunk(
  'reportInstances/generateAndSavePDF',
  async ({ reportInstanceId, options = {} }, { rejectWithValue }) => {
    try {
      const response = await pdfApi.generateAndSave(reportInstanceId, options);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al generar PDF');
    }
  }
);

export const downloadSavedPDF = createAsyncThunk(
  'reportInstances/downloadSavedPDF',
  async ({ reportInstanceId, filename = 'report.pdf' }, { rejectWithValue }) => {
    try {
      const blob = await pdfApi.download(reportInstanceId);
      downloadBlob(blob, filename);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al descargar PDF');
    }
  }
);

export const fetchPDFStatus = createAsyncThunk(
  'reportInstances/fetchPDFStatus',
  async (reportInstanceId, { rejectWithValue }) => {
    try {
      const response = await pdfApi.getStatus(reportInstanceId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener estado');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Instancia actual
  currentInstance: null,
  currentInstanceLoading: false,
  currentInstanceError: null,
  
  // Historial de versiones
  versionHistory: null,
  versionHistoryLoading: false,
  
  // Colaboradores activos
  activeCollaborators: [],
  
  // Estado de PDF
  pdfStatus: null,
  pdfLoading: false,
  pdfError: null,
  
  // Estado de operaciones
  operationLoading: false,
  operationError: null,
  operationSuccess: null,
  
  // Estado de conexión colaborativa
  isConnected: false,
  connectionError: null,
};

// ============================================
// SLICE
// ============================================

const reportInstancesSlice = createSlice({
  name: 'reportInstances',
  initialState,
  reducers: {
    clearCurrentInstance: (state) => {
      state.currentInstance = null;
      state.currentInstanceError = null;
      state.versionHistory = null;
      state.activeCollaborators = [];
    },
    setCurrentInstance: (state, action) => {
      state.currentInstance = action.payload;
    },
    updateCurrentInstanceContent: (state, action) => {
      if (state.currentInstance) {
        state.currentInstance.content = action.payload;
      }
    },
    setActiveCollaborators: (state, action) => {
      state.activeCollaborators = action.payload;
    },
    addCollaborator: (state, action) => {
      const exists = state.activeCollaborators.find(c => c.userId === action.payload.userId);
      if (!exists) {
        state.activeCollaborators.push(action.payload);
      }
    },
    removeCollaborator: (state, action) => {
      state.activeCollaborators = state.activeCollaborators.filter(
        c => c.userId !== action.payload.userId
      );
    },
    updateCollaboratorCursor: (state, action) => {
      const { userId, cursor, selection, color } = action.payload;
      const collaborator = state.activeCollaborators.find(c => c.userId === userId);
      if (collaborator) {
        collaborator.cursor = cursor;
        collaborator.selection = selection;
        collaborator.color = color;
      }
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload.connected;
      state.connectionError = action.payload.error || null;
    },
    clearError: (state) => {
      state.currentInstanceError = null;
      state.operationError = null;
      state.pdfError = null;
      state.connectionError = null;
    },
    clearOperationState: (state) => {
      state.operationLoading = false;
      state.operationError = null;
      state.operationSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch by audit ID
      .addCase(fetchReportInstanceByAuditId.pending, (state) => {
        state.currentInstanceLoading = true;
        state.currentInstanceError = null;
      })
      .addCase(fetchReportInstanceByAuditId.fulfilled, (state, action) => {
        state.currentInstanceLoading = false;
        state.currentInstance = action.payload;
        if (action.payload?.activeCollaborators) {
          state.activeCollaborators = action.payload.activeCollaborators;
        }
      })
      .addCase(fetchReportInstanceByAuditId.rejected, (state, action) => {
        state.currentInstanceLoading = false;
        state.currentInstanceError = action.payload;
      })
      
      // Fetch by ID
      .addCase(fetchReportInstanceById.pending, (state) => {
        state.currentInstanceLoading = true;
        state.currentInstanceError = null;
      })
      .addCase(fetchReportInstanceById.fulfilled, (state, action) => {
        state.currentInstanceLoading = false;
        state.currentInstance = action.payload;
        if (action.payload?.activeCollaborators) {
          state.activeCollaborators = action.payload.activeCollaborators;
        }
      })
      .addCase(fetchReportInstanceById.rejected, (state, action) => {
        state.currentInstanceLoading = false;
        state.currentInstanceError = action.payload;
      })
      
      // Create
      .addCase(createReportInstance.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createReportInstance.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Reporte creado exitosamente';
        state.currentInstance = action.payload;
      })
      .addCase(createReportInstance.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Refresh data
      .addCase(refreshReportInstanceData.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(refreshReportInstanceData.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Datos actualizados';
        state.currentInstance = action.payload;
      })
      .addCase(refreshReportInstanceData.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update content
      .addCase(updateReportInstanceContent.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateReportInstanceContent.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Contenido guardado';
      })
      .addCase(updateReportInstanceContent.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Save version
      .addCase(saveReportInstanceVersion.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(saveReportInstanceVersion.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = `Versión ${action.payload.version} guardada`;
        if (state.currentInstance) {
          state.currentInstance.currentVersion = action.payload.version;
        }
      })
      .addCase(saveReportInstanceVersion.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Fetch version history
      .addCase(fetchReportInstanceVersionHistory.pending, (state) => {
        state.versionHistoryLoading = true;
      })
      .addCase(fetchReportInstanceVersionHistory.fulfilled, (state, action) => {
        state.versionHistoryLoading = false;
        state.versionHistory = action.payload;
      })
      .addCase(fetchReportInstanceVersionHistory.rejected, (state) => {
        state.versionHistoryLoading = false;
      })
      
      // Restore version
      .addCase(restoreReportInstanceVersion.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(restoreReportInstanceVersion.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = `Versión ${action.payload.restoredVersion} restaurada`;
      })
      .addCase(restoreReportInstanceVersion.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Update status
      .addCase(updateReportInstanceStatus.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateReportInstanceStatus.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Estado actualizado';
        if (state.currentInstance) {
          state.currentInstance.status = action.payload.status;
        }
      })
      .addCase(updateReportInstanceStatus.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Lock
      .addCase(lockReportInstance.fulfilled, (state, action) => {
        if (state.currentInstance) {
          state.currentInstance.lockedBy = action.payload.lockedBy;
        }
      })
      
      // Unlock
      .addCase(unlockReportInstance.fulfilled, (state) => {
        if (state.currentInstance) {
          state.currentInstance.lockedBy = null;
        }
      })
      
      // Delete
      .addCase(deleteReportInstance.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deleteReportInstance.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Reporte eliminado';
        state.currentInstance = null;
      })
      .addCase(deleteReportInstance.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      
      // Generate PDF
      .addCase(generatePDF.pending, (state) => {
        state.pdfLoading = true;
        state.pdfError = null;
      })
      .addCase(generatePDF.fulfilled, (state) => {
        state.pdfLoading = false;
      })
      .addCase(generatePDF.rejected, (state, action) => {
        state.pdfLoading = false;
        state.pdfError = action.payload;
      })
      
      // Generate and save PDF
      .addCase(generateAndSavePDF.pending, (state) => {
        state.pdfLoading = true;
        state.pdfError = null;
      })
      .addCase(generateAndSavePDF.fulfilled, (state, action) => {
        state.pdfLoading = false;
        state.operationSuccess = 'PDF generado y guardado';
        state.pdfStatus = {
          status: 'exported',
          lastExport: action.payload
        };
        if (state.currentInstance) {
          state.currentInstance.status = 'exported';
          state.currentInstance.lastExport = action.payload;
        }
      })
      .addCase(generateAndSavePDF.rejected, (state, action) => {
        state.pdfLoading = false;
        state.pdfError = action.payload;
      })
      
      // Download saved PDF
      .addCase(downloadSavedPDF.pending, (state) => {
        state.pdfLoading = true;
      })
      .addCase(downloadSavedPDF.fulfilled, (state) => {
        state.pdfLoading = false;
      })
      .addCase(downloadSavedPDF.rejected, (state, action) => {
        state.pdfLoading = false;
        state.pdfError = action.payload;
      })
      
      // Fetch PDF status
      .addCase(fetchPDFStatus.fulfilled, (state, action) => {
        state.pdfStatus = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  clearCurrentInstance,
  setCurrentInstance,
  updateCurrentInstanceContent,
  setActiveCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorCursor,
  setConnectionStatus,
  clearError,
  clearOperationState,
} = reportInstancesSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectCurrentReportInstance = (state) => state.reportInstances.currentInstance;
export const selectCurrentReportInstanceLoading = (state) => state.reportInstances.currentInstanceLoading;
export const selectCurrentReportInstanceError = (state) => state.reportInstances.currentInstanceError;

export const selectVersionHistory = (state) => state.reportInstances.versionHistory;
export const selectVersionHistoryLoading = (state) => state.reportInstances.versionHistoryLoading;

export const selectActiveCollaborators = (state) => state.reportInstances.activeCollaborators;

export const selectPDFStatus = (state) => state.reportInstances.pdfStatus;
export const selectPDFLoading = (state) => state.reportInstances.pdfLoading;
export const selectPDFError = (state) => state.reportInstances.pdfError;

export const selectIsConnected = (state) => state.reportInstances.isConnected;
export const selectConnectionError = (state) => state.reportInstances.connectionError;

export const selectReportInstanceOperationLoading = (state) => state.reportInstances.operationLoading;
export const selectReportInstanceOperationError = (state) => state.reportInstances.operationError;
export const selectReportInstanceOperationSuccess = (state) => state.reportInstances.operationSuccess;

export default reportInstancesSlice.reducer;
