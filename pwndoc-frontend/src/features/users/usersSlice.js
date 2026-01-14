import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchUsers, 
  fetchUserByUsername, 
  createUser, 
  updateUser,
  fetchRoles 
} from './usersThunks';

/**
 * Users Slice
 * 
 * Estado global para gestión de usuarios
 */

const initialState = {
  // Lista de usuarios
  users: [],
  
  // Usuario seleccionado (para edición/visualización)
  selectedUser: null,
  
  // Roles disponibles
  roles: [],
  
  // Estados de carga
  loading: false,
  loadingRoles: false,
  
  // Errores
  error: null,
  
  // Paginación y filtros
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  
  // Filtros activos
  filters: {
    search: '',
    role: '',
  },
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Limpiar error
    clearError: (state) => {
      state.error = null;
    },
    
    // Establecer usuario seleccionado
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    
    // Limpiar usuario seleccionado
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    
    // Actualizar filtros
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Limpiar filtros
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Establecer paginación
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // Reset completo del estado
    resetUsersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH USERS
      // ============================================
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.pagination.total = action.payload.length;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // FETCH USER BY USERNAME
      // ============================================
      .addCase(fetchUserByUsername.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserByUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserByUsername.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // CREATE USER
      // ============================================
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        // Agregar el nuevo usuario a la lista
        state.users.push(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // UPDATE USER
      // ============================================
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar el usuario en la lista
        const index = state.users.findIndex(u => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        // Actualizar selectedUser si es el mismo
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================
      // FETCH ROLES
      // ============================================
      .addCase(fetchRoles.pending, (state) => {
        state.loadingRoles = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loadingRoles = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loadingRoles = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedUser,
  clearSelectedUser,
  setFilters,
  clearFilters,
  setPagination,
  resetUsersState,
} = usersSlice.actions;

export default usersSlice.reducer;