import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/endpoints/auth.api';
import { 
  setCredentials, 
  setLoading, 
  setError, 
  setRequiresTOTP, 
  logout as logoutAction,
  clearError 
} from './authSlice';

// Helper: Limpiar prefijo "JWT " del token si existe
const cleanToken = (token) => {
  if (!token) return token;
  // Si el token empieza con "JWT ", quitarlo
  if (token.startsWith('JWT ')) {
    console.log('[cleanToken] Removiendo prefijo "JWT" del token');
    return token.substring(4); // Remover "JWT "
  }
  return token;
};

// Check if user exists (init)
export const checkInit = createAsyncThunk(
  'auth/checkInit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.checkInit();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.data || 'Error checking init');
    }
  }
);

// Create first user
export const createFirstUser = createAsyncThunk(
  'auth/createFirstUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await authApi.createFirstUser(userData);
      
      // Después de crear, hacer login automático
      const loginResponse = await authApi.login({
        username: userData.username,
        password: userData.password,
      });
      
      // La respuesta tiene estructura { status: "success", data: { token: "JWT ..." } }
      const tokenData = loginResponse.data;
      const cleanedToken = cleanToken(tokenData.token);
      
      // Guardar token
      dispatch(setCredentials({
        user: null,
        token: cleanedToken,
      }));
      
      // Marcar sesión activa
      localStorage.setItem('hasSession', 'true');
      
      // Obtener el perfil completo
      try {
        const profileResponse = await authApi.getProfile();
        const userProfile = profileResponse.data;
        
        dispatch(setCredentials({
          user: userProfile,
          token: cleanedToken,
        }));
        
        dispatch(setLoading(false));
        return userProfile;
      } catch (profileError) {
        console.error('Error getting profile after create:', profileError);
        dispatch(setLoading(false));
        return tokenData;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.data || 'Error creating user';
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      return rejectWithValue(errorMessage);
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await authApi.login(credentials);
      
      console.log('Login response:', response);
      
      // Verificar si la respuesta indica que se requiere TOTP
      if (response.status === 'totp_required' || response.data?.totpRequired) {
        dispatch(setRequiresTOTP(true));
        dispatch(setLoading(false));
        return rejectWithValue('TOTP_REQUIRED');
      }
      
      // La respuesta tiene estructura { status: "success", data: { token: "JWT ..." } }
      const tokenData = response.data;
      
      if (tokenData.token) {
        const cleanedToken = cleanToken(tokenData.token);
        console.log('Token limpio:', cleanedToken.substring(0, 20) + '...');
        
        // Guardar token temporalmente
        dispatch(setCredentials({
          user: null,
          token: cleanedToken,
        }));
        
        // Marcar sesión activa
        localStorage.setItem('hasSession', 'true');
        
        // Ahora obtener el perfil completo del usuario
        try {
          const profileResponse = await authApi.getProfile();
          const userData = profileResponse.data;
          
          console.log('User profile:', userData);
          
          dispatch(setCredentials({
            user: userData,
            token: cleanedToken,
          }));
          
          dispatch(setLoading(false));
          return userData;
        } catch (profileError) {
          console.error('Error getting profile after login:', profileError);
          // Si no podemos obtener el perfil, al menos tenemos el token
          dispatch(setLoading(false));
          return tokenData;
        }
      }
      
      throw new Error('No token received');
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Credenciales inválidas';
      let requiresTOTP = false;
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data?.data || error.response.data?.message || '';
        
        if (status === 400 && data.includes('TOTP')) {
          requiresTOTP = true;
          errorMessage = 'TOTP_REQUIRED';
        } else if (status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
        } else {
          errorMessage = data || 'Error al iniciar sesión';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor';
      } else {
        errorMessage = error.message || 'Error al iniciar sesión';
      }
      
      if (requiresTOTP) {
        dispatch(setRequiresTOTP(true));
        dispatch(setLoading(false));
        return rejectWithValue('TOTP_REQUIRED');
      }
      
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      return rejectWithValue(errorMessage);
    }
  }
);

// Login with TOTP
export const loginWithTOTP = createAsyncThunk(
  'auth/loginWithTOTP',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const response = await authApi.loginWithTOTP(credentials);
      
      console.log('Login TOTP response:', response);
      
      // La respuesta tiene estructura { status: "success", data: { token: "JWT ..." } }
      const tokenData = response.data;
      
      if (tokenData.token) {
        const cleanedToken = cleanToken(tokenData.token);
        
        // Guardar token temporalmente
        dispatch(setCredentials({
          user: null,
          token: cleanedToken,
        }));
        
        // Marcar sesión activa
        localStorage.setItem('hasSession', 'true');
        
        // Obtener el perfil completo del usuario
        try {
          const profileResponse = await authApi.getProfile();
          const userData = profileResponse.data;
          
          console.log('User profile:', userData);
          
          dispatch(setCredentials({
            user: userData,
            token: cleanedToken,
          }));
          
          dispatch(setLoading(false));
          return userData;
        } catch (profileError) {
          console.error('Error getting profile after TOTP login:', profileError);
          dispatch(setLoading(false));
          return tokenData;
        }
      }
      
      throw new Error('No token received');
      
    } catch (error) {
      console.error('Login TOTP error:', error);
      
      let errorMessage = 'Código TOTP inválido';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data?.data || error.response.data?.message || '';
        
        if (status === 401) {
          errorMessage = 'Código TOTP incorrecto';
        } else if (status === 400) {
          errorMessage = data || 'Código TOTP inválido';
        } else {
          errorMessage = data || 'Error al validar código TOTP';
        }
      }
      
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      return rejectWithValue(errorMessage);
    }
  }
);

// Logout - Llama al servidor y limpia localmente
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Primero intentar logout en el servidor (elimina la sesión)
      await authApi.logout();
      console.log('Logout del servidor completado');
    } catch (error) {
      console.warn('Error en logout del servidor:', error);
    }
    
    // Limpiar localStorage
    localStorage.removeItem('hasSession');
    
    // Siempre limpiar estado local
    dispatch(logoutAction());
    console.log('Logout local completado');
  }
);

// Get profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      
      console.log('Profile response:', response);
      
      // La respuesta tiene estructura { status: "success", data: { user data } }
      // Extraer los datos del usuario
      const userData = response.data;
      
      console.log('User data extracted:', userData);
      
      // Obtener token actual de Redux
      const currentToken = getState().auth.token;
      
      dispatch(setCredentials({
        user: userData,
        token: currentToken,
      }));
      
      // Marcar que hay sesión activa
      localStorage.setItem('hasSession', 'true');
      
      return userData;
    } catch (error) {
      console.error('Get profile error:', error);
      
      // Si falla (401), hacer logout
      if (error.response?.status === 401) {
        dispatch(logoutAction());
      }
      
      return rejectWithValue(error.response?.data?.data);
    }
  }
);