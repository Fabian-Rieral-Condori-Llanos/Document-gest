/**
 * Users Selectors
 * 
 * Selectores para acceder al estado de usuarios
 */

// Básicos
export const selectUsersState = (state) => state.users;
export const selectAllUsers = (state) => state.users.users;
export const selectSelectedUser = (state) => state.users.selectedUser;
export const selectRoles = (state) => state.users.roles;

// Estados de carga
export const selectUsersLoading = (state) => state.users.loading;
export const selectRolesLoading = (state) => state.users.loadingRoles;

// Errores
export const selectUsersError = (state) => state.users.error;

// Paginación y filtros
export const selectUsersPagination = (state) => state.users.pagination;
export const selectUsersFilters = (state) => state.users.filters;

// Selectores derivados

/**
 * Obtener usuarios filtrados por búsqueda y rol
 */
export const selectFilteredUsers = (state) => {
  const { users, filters } = state.users;
  
  return users.filter(user => {
    // Filtro por búsqueda (username, firstname, lastname, email)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        user.username?.toLowerCase().includes(search) ||
        user.firstname?.toLowerCase().includes(search) ||
        user.lastname?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);
      
      if (!matchesSearch) return false;
    }
    
    // Filtro por rol
    if (filters.role && user.role !== filters.role) {
      return false;
    }
    
    return true;
  });
};

/**
 * Obtener conteo de usuarios por rol
 */
export const selectUsersByRoleCount = (state) => {
  const users = state.users.users;
  
  return users.reduce((acc, user) => {
    const role = user.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Obtener usuario por ID
 */
export const selectUserById = (id) => (state) => {
  return state.users.users.find(user => user._id === id);
};

/**
 * Obtener usuario por username
 */
export const selectUserByUsername = (username) => (state) => {
  return state.users.users.find(user => user.username === username);
};

/**
 * Verificar si hay usuarios cargados
 */
export const selectHasUsers = (state) => state.users.users.length > 0;

/**
 * Obtener total de usuarios
 */
export const selectTotalUsers = (state) => state.users.users.length;