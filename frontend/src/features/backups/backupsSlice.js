import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import backupsApi from '../../api/endpoints/backups.api';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchBackups = createAsyncThunk(
  'backups/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backupsApi.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener backups');
    }
  }
);

export const fetchBackupStatus = createAsyncThunk(
  'backups/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backupsApi.getStatus();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener estado');
    }
  }
);

export const fetchDiskUsage = createAsyncThunk(
  'backups/fetchDiskUsage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await backupsApi.getDiskUsage();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener uso de disco');
    }
  }
);

export const fetchBackupInfo = createAsyncThunk(
  'backups/fetchInfo',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await backupsApi.getInfo(slug);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener información');
    }
  }
);

export const createBackup = createAsyncThunk(
  'backups/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await backupsApi.create(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear backup');
    }
  }
);

export const uploadBackup = createAsyncThunk(
  'backups/upload',
  async (file, { rejectWithValue }) => {
    try {
      const response = await backupsApi.upload(file);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al subir backup');
    }
  }
);

export const restoreBackup = createAsyncThunk(
  'backups/restore',
  async ({ slug, data }, { rejectWithValue }) => {
    try {
      const response = await backupsApi.restore(slug, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al restaurar backup');
    }
  }
);

export const deleteBackup = createAsyncThunk(
  'backups/delete',
  async (slug, { rejectWithValue }) => {
    try {
      await backupsApi.delete(slug);
      return slug;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar backup');
    }
  }
);

export const downloadBackup = createAsyncThunk(
  'backups/download',
  async ({ slug, filename }, { rejectWithValue }) => {
    try {
      const response = await backupsApi.download(slug);
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `backup-${slug}.tar`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al descargar backup');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Lista de backups
  backups: [],
  backupsLoading: false,
  backupsError: null,

  // Backup seleccionado
  selectedBackup: null,
  selectedBackupLoading: false,

  // Estado del proceso
  operationStatus: {
    operation: 'idle',
    state: 'idle',
    message: '',
  },
  statusLoading: false,

  // Uso de disco
  diskUsage: null,
  diskUsageLoading: false,

  // Estado de operaciones
  operationLoading: false,
  operationError: null,
  operationSuccess: null,
};

// ============================================
// SLICE
// ============================================

const backupsSlice = createSlice({
  name: 'backups',
  initialState,
  reducers: {
    clearSelectedBackup: (state) => {
      state.selectedBackup = null;
    },
    clearOperationState: (state) => {
      state.operationError = null;
      state.operationSuccess = null;
    },
    setOperationStatus: (state, action) => {
      state.operationStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all backups
      .addCase(fetchBackups.pending, (state) => {
        state.backupsLoading = true;
        state.backupsError = null;
      })
      .addCase(fetchBackups.fulfilled, (state, action) => {
        state.backupsLoading = false;
        state.backups = action.payload || [];
      })
      .addCase(fetchBackups.rejected, (state, action) => {
        state.backupsLoading = false;
        state.backupsError = action.payload;
      })

      // Fetch status
      .addCase(fetchBackupStatus.pending, (state) => {
        state.statusLoading = true;
      })
      .addCase(fetchBackupStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.operationStatus = action.payload;
      })
      .addCase(fetchBackupStatus.rejected, (state) => {
        state.statusLoading = false;
      })

      // Fetch disk usage
      .addCase(fetchDiskUsage.pending, (state) => {
        state.diskUsageLoading = true;
      })
      .addCase(fetchDiskUsage.fulfilled, (state, action) => {
        state.diskUsageLoading = false;
        state.diskUsage = action.payload;
      })
      .addCase(fetchDiskUsage.rejected, (state) => {
        state.diskUsageLoading = false;
      })

      // Fetch backup info
      .addCase(fetchBackupInfo.pending, (state) => {
        state.selectedBackupLoading = true;
      })
      .addCase(fetchBackupInfo.fulfilled, (state, action) => {
        state.selectedBackupLoading = false;
        state.selectedBackup = action.payload;
      })
      .addCase(fetchBackupInfo.rejected, (state) => {
        state.selectedBackupLoading = false;
      })

      // Create backup
      .addCase(createBackup.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createBackup.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Backup iniciado correctamente';
      })
      .addCase(createBackup.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Upload backup
      .addCase(uploadBackup.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(uploadBackup.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Backup subido correctamente';
      })
      .addCase(uploadBackup.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Restore backup
      .addCase(restoreBackup.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(restoreBackup.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Restauración iniciada correctamente';
      })
      .addCase(restoreBackup.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Delete backup
      .addCase(deleteBackup.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(deleteBackup.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.operationSuccess = 'Backup eliminado correctamente';
        state.backups = state.backups.filter(b => b.slug !== action.payload);
      })
      .addCase(deleteBackup.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Download backup
      .addCase(downloadBackup.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(downloadBackup.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = 'Descarga iniciada';
      })
      .addCase(downloadBackup.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  clearSelectedBackup,
  clearOperationState,
  setOperationStatus,
} = backupsSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectBackups = (state) => state.backups.backups;
export const selectBackupsLoading = (state) => state.backups.backupsLoading;
export const selectBackupsError = (state) => state.backups.backupsError;

export const selectSelectedBackup = (state) => state.backups.selectedBackup;
export const selectSelectedBackupLoading = (state) => state.backups.selectedBackupLoading;

export const selectOperationStatus = (state) => state.backups.operationStatus;
export const selectStatusLoading = (state) => state.backups.statusLoading;

export const selectDiskUsage = (state) => state.backups.diskUsage;
export const selectDiskUsageLoading = (state) => state.backups.diskUsageLoading;

export const selectBackupOperationLoading = (state) => state.backups.operationLoading;
export const selectBackupOperationError = (state) => state.backups.operationError;
export const selectBackupOperationSuccess = (state) => state.backups.operationSuccess;

export default backupsSlice.reducer;