import api from './axios.config';
import { store } from '../store/store';
import { logout, setCredentials } from '../features/auth/authSlice';

// Variable para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Agregar token con formato JWT
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      // El backend espera "JWT <token>" no "Bearer <token>"
      // Verificar si el token ya tiene el prefijo
      if (token.startsWith('JWT ')) {
        config.headers.Authorization = token;
      } else {
        config.headers.Authorization = `JWT ${token}`;
      }
      console.log('[interceptor] Request CON token:', config.method.toUpperCase(), config.url);
    } else {
      console.log('[interceptor] Request SIN token:', config.method.toUpperCase(), config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Manejar 401 y refresh token
api.interceptors.response.use(
  (response) => {
    console.log('[interceptor] Response OK:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'no-status';
    
    console.log('[interceptor] Response Error:', url, status);
    
    // Si es 401 y no es una petición de login/init/refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthRequest = url.includes('/login') || 
                           url.includes('/init') || 
                           url.includes('/refreshtoken');
      
      if (isAuthRequest) {
        console.log('[interceptor] 401 en petición de auth, no hacer refresh');
        return Promise.reject(error);
      }
      
      // Intentar refresh token
      if (isRefreshing) {
        // Si ya está refrescando, encolar esta petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token.startsWith('JWT ')) {
            originalRequest.headers.Authorization = token;
          } else {
            originalRequest.headers.Authorization = `JWT ${token}`;
          }
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log('[interceptor] Intentando refresh token...');
        
        // Llamar al endpoint de refresh (usa las cookies automáticamente)
        const refreshResponse = await api.get('/users/refreshtoken');
        
        if (refreshResponse.data?.data?.token) {
          const newToken = refreshResponse.data.data.token;
          console.log('[interceptor] Token refrescado exitosamente');
          
          // Actualizar token en Redux y localStorage
          const state = store.getState();
          store.dispatch(setCredentials({
            user: state.auth.user,
            token: newToken.startsWith('JWT ') ? newToken.substring(4) : newToken
          }));
          
          // Reintentar la petición original con el nuevo token
          if (newToken.startsWith('JWT ')) {
            originalRequest.headers.Authorization = newToken;
          } else {
            originalRequest.headers.Authorization = `JWT ${newToken}`;
          }
          
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[interceptor] Error en refresh token:', refreshError);
        processQueue(refreshError, null);
        
        // Si el refresh falla, hacer logout
        console.log('[interceptor] Refresh falló, haciendo logout...');
        store.dispatch(logout());
        
        // Redirigir a login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;