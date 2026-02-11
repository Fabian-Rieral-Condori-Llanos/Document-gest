import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsApi } from '../../api/endpoints/settings.api';

// ============================================
// THUNKS
// ============================================

export const fetchSettingsPublic = createAsyncThunk(
  'settings/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getPublic();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener configuración');
    }
  }
);

export const fetchSettings = createAsyncThunk(
  'settings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener configuración');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await settingsApi.update(settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar configuración');
    }
  }
);

export const restoreSettingsDefaults = createAsyncThunk(
  'settings/restoreDefaults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await settingsApi.restoreDefaults();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al restaurar valores por defecto');
    }
  }
);

// ============================================
// SLICE
// ============================================

const initialState = {
  settings: null,
  loading: false,
  error: null,
  updateSuccess: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public
      .addCase(fetchSettingsPublic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettingsPublic.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettingsPublic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      // Restore defaults
      .addCase(restoreSettingsDefaults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreSettingsDefaults.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.updateSuccess = true;
      })
      .addCase(restoreSettingsDefaults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearUpdateSuccess } = settingsSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectSettings = (state) => state.settings.settings;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsError = (state) => state.settings.error;
export const selectSettingsUpdateSuccess = (state) => state.settings.updateSuccess;

// Selectores específicos para configuración de reportes
export const selectReportSettings = (state) => state.settings.settings?.report;
export const selectReviewsSettings = (state) => state.settings.settings?.reviews;
export const selectCvssColors = (state) => state.settings.settings?.report?.public?.cvssColors;
export const selectRequiredFields = (state) => state.settings.settings?.report?.public?.requiredFields;

export default settingsSlice.reducer;