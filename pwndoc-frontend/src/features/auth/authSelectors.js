export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectRequiresTOTP = (state) => state.auth.requiresTOTP;
export const selectAuthToken = (state) => state.auth.token;

export const selectIsAdmin = (state) => {
  return state.auth.user?.role === 'admin';
};

export const selectHasPermission = (state, permission) => {
  const user = state.auth.user;
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin tiene todos los permisos
  return user.permissions?.includes(permission) || false;
};