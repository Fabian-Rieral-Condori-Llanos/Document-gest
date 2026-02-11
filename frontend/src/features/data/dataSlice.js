import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dataApi } from '../../api/endpoints/data.api';

// ============================================
// THUNKS - Languages
// ============================================

export const fetchLanguages = createAsyncThunk(
  'data/fetchLanguages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getLanguages();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener idiomas');
    }
  }
);

export const createLanguage = createAsyncThunk(
  'data/createLanguage',
  async (languageData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createLanguage(languageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear idioma');
    }
  }
);

export const deleteLanguage = createAsyncThunk(
  'data/deleteLanguage',
  async (locale, { rejectWithValue }) => {
    try {
      await dataApi.deleteLanguage(locale);
      return locale;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar idioma');
    }
  }
);

// ============================================
// THUNKS - Audit Types
// ============================================

export const fetchAuditTypes = createAsyncThunk(
  'data/fetchAuditTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getAuditTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener tipos de auditoría');
    }
  }
);

export const createAuditType = createAsyncThunk(
  'data/createAuditType',
  async (auditTypeData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createAuditType(auditTypeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear tipo de auditoría');
    }
  }
);

export const updateAuditType = createAsyncThunk(
  'data/updateAuditType',
  async ({ id, auditTypeData }, { rejectWithValue }) => {
    try {
      const response = await dataApi.updateAuditType(id, auditTypeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar tipo de auditoría');
    }
  }
);

export const deleteAuditType = createAsyncThunk(
  'data/deleteAuditType',
  async (id, { rejectWithValue }) => {
    try {
      await dataApi.deleteAuditType(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar tipo de auditoría');
    }
  }
);

// ============================================
// THUNKS - Vulnerability Types
// ============================================

export const fetchVulnerabilityTypes = createAsyncThunk(
  'data/fetchVulnerabilityTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getVulnerabilityTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener tipos de vulnerabilidad');
    }
  }
);

export const createVulnerabilityType = createAsyncThunk(
  'data/createVulnerabilityType',
  async (vulnTypeData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createVulnerabilityType(vulnTypeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear tipo de vulnerabilidad');
    }
  }
);

export const deleteVulnerabilityType = createAsyncThunk(
  'data/deleteVulnerabilityType',
  async (name, { rejectWithValue }) => {
    try {
      await dataApi.deleteVulnerabilityType(name);
      return name;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar tipo de vulnerabilidad');
    }
  }
);

// ============================================
// THUNKS - Vulnerability Categories
// ============================================

export const fetchVulnerabilityCategories = createAsyncThunk(
  'data/fetchVulnerabilityCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getVulnerabilityCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener categorías');
    }
  }
);

export const createVulnerabilityCategory = createAsyncThunk(
  'data/createVulnerabilityCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createVulnerabilityCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear categoría');
    }
  }
);

export const deleteVulnerabilityCategory = createAsyncThunk(
  'data/deleteVulnerabilityCategory',
  async (id, { rejectWithValue }) => {
    try {
      await dataApi.deleteVulnerabilityCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar categoría');
    }
  }
);

// ============================================
// THUNKS - Custom Fields
// ============================================

export const fetchCustomFields = createAsyncThunk(
  'data/fetchCustomFields',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getCustomFields();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener campos personalizados');
    }
  }
);

export const createCustomField = createAsyncThunk(
  'data/createCustomField',
  async (fieldData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createCustomField(fieldData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear campo personalizado');
    }
  }
);

export const updateCustomField = createAsyncThunk(
  'data/updateCustomField',
  async ({ id, fieldData }, { rejectWithValue }) => {
    try {
      const response = await dataApi.updateCustomField(id, fieldData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar campo personalizado');
    }
  }
);

export const deleteCustomField = createAsyncThunk(
  'data/deleteCustomField',
  async (id, { rejectWithValue }) => {
    try {
      await dataApi.deleteCustomField(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar campo personalizado');
    }
  }
);

// ============================================
// THUNKS - Custom Sections
// ============================================

export const fetchCustomSections = createAsyncThunk(
  'data/fetchCustomSections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dataApi.getCustomSections();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al obtener secciones personalizadas');
    }
  }
);

export const createCustomSection = createAsyncThunk(
  'data/createCustomSection',
  async (sectionData, { rejectWithValue }) => {
    try {
      const response = await dataApi.createCustomSection(sectionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al crear sección personalizada');
    }
  }
);

export const updateCustomSection = createAsyncThunk(
  'data/updateCustomSection',
  async ({ id, sectionData }, { rejectWithValue }) => {
    try {
      const response = await dataApi.updateCustomSection(id, sectionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al actualizar sección personalizada');
    }
  }
);

export const deleteCustomSection = createAsyncThunk(
  'data/deleteCustomSection',
  async (id, { rejectWithValue }) => {
    try {
      await dataApi.deleteCustomSection(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error al eliminar sección personalizada');
    }
  }
);

// ============================================
// SLICE
// ============================================

const initialState = {
  // Languages
  languages: [],
  languagesLoading: false,
  languagesError: null,

  // Audit Types
  auditTypes: [],
  auditTypesLoading: false,
  auditTypesError: null,

  // Vulnerability Types
  vulnerabilityTypes: [],
  vulnerabilityTypesLoading: false,
  vulnerabilityTypesError: null,

  // Vulnerability Categories
  vulnerabilityCategories: [],
  vulnerabilityCategoriesLoading: false,
  vulnerabilityCategoriesError: null,

  // Custom Fields
  customFields: [],
  customFieldsLoading: false,
  customFieldsError: null,

  // Custom Sections
  customSections: [],
  customSectionsLoading: false,
  customSectionsError: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearLanguagesError: (state) => {
      state.languagesError = null;
    },
    clearAuditTypesError: (state) => {
      state.auditTypesError = null;
    },
    clearVulnerabilityTypesError: (state) => {
      state.vulnerabilityTypesError = null;
    },
    clearVulnerabilityCategoriesError: (state) => {
      state.vulnerabilityCategoriesError = null;
    },
    clearCustomFieldsError: (state) => {
      state.customFieldsError = null;
    },
    clearCustomSectionsError: (state) => {
      state.customSectionsError = null;
    },
    clearAllErrors: (state) => {
      state.languagesError = null;
      state.auditTypesError = null;
      state.vulnerabilityTypesError = null;
      state.vulnerabilityCategoriesError = null;
      state.customFieldsError = null;
      state.customSectionsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Languages
      // ============================================
      .addCase(fetchLanguages.pending, (state) => {
        state.languagesLoading = true;
        state.languagesError = null;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.languagesLoading = false;
        state.languages = action.payload;
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.languagesLoading = false;
        state.languagesError = action.payload;
      })
      .addCase(createLanguage.fulfilled, (state, action) => {
        state.languages.push(action.payload);
      })
      .addCase(createLanguage.rejected, (state, action) => {
        state.languagesError = action.payload;
      })
      .addCase(deleteLanguage.fulfilled, (state, action) => {
        state.languages = state.languages.filter(l => l.locale !== action.payload);
      })
      .addCase(deleteLanguage.rejected, (state, action) => {
        state.languagesError = action.payload;
      })

      // ============================================
      // Audit Types
      // ============================================
      .addCase(fetchAuditTypes.pending, (state) => {
        state.auditTypesLoading = true;
        state.auditTypesError = null;
      })
      .addCase(fetchAuditTypes.fulfilled, (state, action) => {
        state.auditTypesLoading = false;
        state.auditTypes = action.payload;
      })
      .addCase(fetchAuditTypes.rejected, (state, action) => {
        state.auditTypesLoading = false;
        state.auditTypesError = action.payload;
      })
      .addCase(createAuditType.fulfilled, (state, action) => {
        state.auditTypes.push(action.payload);
      })
      .addCase(createAuditType.rejected, (state, action) => {
        state.auditTypesError = action.payload;
      })
      .addCase(updateAuditType.fulfilled, (state, action) => {
        const index = state.auditTypes.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.auditTypes[index] = action.payload;
        }
      })
      .addCase(updateAuditType.rejected, (state, action) => {
        state.auditTypesError = action.payload;
      })
      .addCase(deleteAuditType.fulfilled, (state, action) => {
        state.auditTypes = state.auditTypes.filter(t => t._id !== action.payload);
      })
      .addCase(deleteAuditType.rejected, (state, action) => {
        state.auditTypesError = action.payload;
      })

      // ============================================
      // Vulnerability Types
      // ============================================
      .addCase(fetchVulnerabilityTypes.pending, (state) => {
        state.vulnerabilityTypesLoading = true;
        state.vulnerabilityTypesError = null;
      })
      .addCase(fetchVulnerabilityTypes.fulfilled, (state, action) => {
        state.vulnerabilityTypesLoading = false;
        state.vulnerabilityTypes = action.payload;
      })
      .addCase(fetchVulnerabilityTypes.rejected, (state, action) => {
        state.vulnerabilityTypesLoading = false;
        state.vulnerabilityTypesError = action.payload;
      })
      .addCase(createVulnerabilityType.fulfilled, (state, action) => {
        state.vulnerabilityTypes.push(action.payload);
      })
      .addCase(createVulnerabilityType.rejected, (state, action) => {
        state.vulnerabilityTypesError = action.payload;
      })
      .addCase(deleteVulnerabilityType.fulfilled, (state, action) => {
        state.vulnerabilityTypes = state.vulnerabilityTypes.filter(t => t.name !== action.payload);
      })
      .addCase(deleteVulnerabilityType.rejected, (state, action) => {
        state.vulnerabilityTypesError = action.payload;
      })

      // ============================================
      // Vulnerability Categories
      // ============================================
      .addCase(fetchVulnerabilityCategories.pending, (state) => {
        state.vulnerabilityCategoriesLoading = true;
        state.vulnerabilityCategoriesError = null;
      })
      .addCase(fetchVulnerabilityCategories.fulfilled, (state, action) => {
        state.vulnerabilityCategoriesLoading = false;
        state.vulnerabilityCategories = action.payload;
      })
      .addCase(fetchVulnerabilityCategories.rejected, (state, action) => {
        state.vulnerabilityCategoriesLoading = false;
        state.vulnerabilityCategoriesError = action.payload;
      })
      .addCase(createVulnerabilityCategory.fulfilled, (state, action) => {
        state.vulnerabilityCategories.push(action.payload);
      })
      .addCase(createVulnerabilityCategory.rejected, (state, action) => {
        state.vulnerabilityCategoriesError = action.payload;
      })
      .addCase(deleteVulnerabilityCategory.fulfilled, (state, action) => {
        state.vulnerabilityCategories = state.vulnerabilityCategories.filter(c => c._id !== action.payload);
      })
      .addCase(deleteVulnerabilityCategory.rejected, (state, action) => {
        state.vulnerabilityCategoriesError = action.payload;
      })

      // ============================================
      // Custom Fields
      // ============================================
      .addCase(fetchCustomFields.pending, (state) => {
        state.customFieldsLoading = true;
        state.customFieldsError = null;
      })
      .addCase(fetchCustomFields.fulfilled, (state, action) => {
        state.customFieldsLoading = false;
        state.customFields = action.payload;
      })
      .addCase(fetchCustomFields.rejected, (state, action) => {
        state.customFieldsLoading = false;
        state.customFieldsError = action.payload;
      })
      .addCase(createCustomField.fulfilled, (state, action) => {
        state.customFields.push(action.payload);
      })
      .addCase(createCustomField.rejected, (state, action) => {
        state.customFieldsError = action.payload;
      })
      .addCase(updateCustomField.fulfilled, (state, action) => {
        const index = state.customFields.findIndex(f => f._id === action.payload._id);
        if (index !== -1) {
          state.customFields[index] = action.payload;
        }
      })
      .addCase(updateCustomField.rejected, (state, action) => {
        state.customFieldsError = action.payload;
      })
      .addCase(deleteCustomField.fulfilled, (state, action) => {
        state.customFields = state.customFields.filter(f => f._id !== action.payload);
      })
      .addCase(deleteCustomField.rejected, (state, action) => {
        state.customFieldsError = action.payload;
      })

      // ============================================
      // Custom Sections
      // ============================================
      .addCase(fetchCustomSections.pending, (state) => {
        state.customSectionsLoading = true;
        state.customSectionsError = null;
      })
      .addCase(fetchCustomSections.fulfilled, (state, action) => {
        state.customSectionsLoading = false;
        state.customSections = action.payload;
      })
      .addCase(fetchCustomSections.rejected, (state, action) => {
        state.customSectionsLoading = false;
        state.customSectionsError = action.payload;
      })
      .addCase(createCustomSection.fulfilled, (state, action) => {
        state.customSections.push(action.payload);
      })
      .addCase(createCustomSection.rejected, (state, action) => {
        state.customSectionsError = action.payload;
      })
      .addCase(updateCustomSection.fulfilled, (state, action) => {
        const index = state.customSections.findIndex(s => s._id === action.payload._id);
        if (index !== -1) {
          state.customSections[index] = action.payload;
        }
      })
      .addCase(updateCustomSection.rejected, (state, action) => {
        state.customSectionsError = action.payload;
      })
      .addCase(deleteCustomSection.fulfilled, (state, action) => {
        state.customSections = state.customSections.filter(s => s._id !== action.payload);
      })
      .addCase(deleteCustomSection.rejected, (state, action) => {
        state.customSectionsError = action.payload;
      });
  },
});

export const {
  clearLanguagesError,
  clearAuditTypesError,
  clearVulnerabilityTypesError,
  clearVulnerabilityCategoriesError,
  clearCustomFieldsError,
  clearCustomSectionsError,
  clearAllErrors,
} = dataSlice.actions;

// ============================================
// SELECTORS
// ============================================

// Languages
export const selectLanguages = (state) => state.data.languages;
export const selectLanguagesLoading = (state) => state.data.languagesLoading;
export const selectLanguagesError = (state) => state.data.languagesError;

// Audit Types
export const selectAuditTypes = (state) => state.data.auditTypes;
export const selectAuditTypesLoading = (state) => state.data.auditTypesLoading;
export const selectAuditTypesError = (state) => state.data.auditTypesError;

// Vulnerability Types
export const selectVulnerabilityTypes = (state) => state.data.vulnerabilityTypes;
export const selectVulnerabilityTypesLoading = (state) => state.data.vulnerabilityTypesLoading;
export const selectVulnerabilityTypesError = (state) => state.data.vulnerabilityTypesError;

// Selector para obtener tipos de vulnerabilidad por idioma
export const selectVulnerabilityTypesByLocale = (locale) => (state) => {
  return state.data.vulnerabilityTypes.filter(vt => vt.locale === locale);
};

// Vulnerability Categories
export const selectVulnerabilityCategories = (state) => state.data.vulnerabilityCategories;
export const selectVulnerabilityCategoriesLoading = (state) => state.data.vulnerabilityCategoriesLoading;
export const selectVulnerabilityCategoriesError = (state) => state.data.vulnerabilityCategoriesError;

// Custom Fields
export const selectCustomFields = (state) => state.data.customFields;
export const selectCustomFieldsLoading = (state) => state.data.customFieldsLoading;
export const selectCustomFieldsError = (state) => state.data.customFieldsError;

// Custom Sections
export const selectCustomSections = (state) => state.data.customSections;
export const selectCustomSectionsLoading = (state) => state.data.customSectionsLoading;
export const selectCustomSectionsError = (state) => state.data.customSectionsError;

export default dataSlice.reducer;