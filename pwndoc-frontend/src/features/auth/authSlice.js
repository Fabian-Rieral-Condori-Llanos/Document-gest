import { createSlice } from '@reduxjs/toolkit';

// Obtener token de localStorage al iniciar
const getInitialToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[authSlice] Token encontrado en localStorage al iniciar:', token.substring(0, 20) + '...');
      return token;
    }
    console.log('[authSlice] No hay token en localStorage');
    return null;
  } catch (error) {
    console.error('[authSlice] Error reading token from localStorage:', error);
    return null;
  }
};

const initialToken = getInitialToken();

const initialState = {
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken, // Si hay token, está autenticado
  isLoading: false,
  error: null,
  requiresTOTP: false,
};

console.log('🏁 [authSlice] Estado inicial:', {
  hasToken: !!initialState.token,
  isAuthenticated: initialState.isAuthenticated
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      console.log('[setCredentials] Guardando credenciales');
      
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.requiresTOTP = false;
      state.error = null;
      
      // Guardar token en localStorage
      if (token) {
        try {
          localStorage.setItem('token', token);
          console.log('[setCredentials] Token guardado en localStorage');
        } catch (error) {
          console.error('[setCredentials] Error guardando token:', error);
        }
      }
    },
    
    setRequiresTOTP: (state, action) => {
      state.requiresTOTP = action.payload;
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    logout: (state) => {
      console.log('🚪 [logout] Iniciando logout...');
      
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.requiresTOTP = false;
      state.error = null;
      
      // Limpiar localStorage SOLO el token
      try {
        const tokenBefore = localStorage.getItem('token');
        console.log('[logout] Token antes de borrar:', tokenBefore ? tokenBefore.substring(0, 20) + '...' : 'null');
        
        localStorage.removeItem('token');
        
        const tokenAfter = localStorage.getItem('token');
        console.log('[logout] Token después de borrar:', tokenAfter ? 'TODAVÍA EXISTE!' : 'null (correcto)');
      } catch (error) {
        console.error('[logout] Error eliminando token:', error);
      }
    },
    
    // Nueva acción para hidratar desde localStorage
    hydrateAuth: (state) => {
      console.log('[hydrateAuth] Hidratando auth desde localStorage...');
      const token = getInitialToken();
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        console.log('[hydrateAuth] Auth hidratado correctamente');
      } else {
        console.log('[hydrateAuth] No hay token para hidratar');
      }
    },
  },
});

export const {
  setCredentials,
  setRequiresTOTP,
  setLoading,
  setError,
  clearError,
  logout,
  hydrateAuth,
} = authSlice.actions;

export default authSlice.reducer;