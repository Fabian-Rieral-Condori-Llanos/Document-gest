import api from '../axios.config';

/**
 * API de Autenticación
 * 
 * Endpoints para autenticación y gestión de sesión
 * Base path: /api/users
 */
export const authApi = {
  // ============================================
  // INIT (Setup inicial)
  // ============================================

  /**
   * Verificar si existe usuario inicial
   * GET /users/init
   * Público (sin autenticación)
   */
  checkInit: async () => {
    const response = await api.get('/users/init');
    return response.data;
  },

  /**
   * Crear primer usuario (admin)
   * POST /users/init
   * Público (sin autenticación)
   */
  createFirstUser: async (userData) => {
    const response = await api.post('/users/init', userData);
    return response.data;
  },

  // ============================================
  // LOGIN
  // ============================================

  /**
   * Login (sin TOTP)
   * POST /users/login
   * Público (sin autenticación)
   */
  login: async (credentials) => {
    console.log('[authApi] Login request:', { username: credentials.username });
    const response = await api.post('/users/login', credentials);
    console.log('[authApi] Login response:', response.data);
    return response.data;
  },

  /**
   * Login con TOTP
   * POST /users/login
   * Público (sin autenticación)
   */
  loginWithTOTP: async (credentials) => {
    console.log('[authApi] Login TOTP request');
    const response = await api.post('/users/login', {
      username: credentials.username,
      password: credentials.password,
      totpToken: credentials.totpToken
    });
    console.log('[authApi] Login TOTP response:', response.data);
    return response.data;
  },

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Verificar si el token actual es válido
   * GET /users/checktoken
   * Requiere: token válido
   */
  checkToken: async () => {
    const response = await api.get('/users/checktoken');
    return response.data;
  },

  /**
   * Refrescar token de acceso
   * GET /users/refreshtoken
   * Requiere: refreshToken cookie
   */
  refreshToken: async () => {
    console.log('[authApi] Refresh token request...');
    const response = await api.get('/users/refreshtoken');
    console.log('[authApi] Refresh response:', response.data);
    return response.data;
  },

  /**
   * Logout (eliminar sesión)
   * DELETE /users/refreshtoken
   * Requiere: refreshToken cookie
   */
  logout: async () => {
    console.log('[authApi] Logout request...');
    const response = await api.delete('/users/refreshtoken');
    console.log('[authApi] Logout response:', response.data);
    return response.data;
  },

  // ============================================
  // PERFIL
  // ============================================

  /**
   * Obtener perfil del usuario actual
   * GET /users/me
   * Requiere: token válido
   */
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Actualizar perfil del usuario actual
   * PUT /users/me
   * Requiere: token válido
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },
};

export default authApi;

