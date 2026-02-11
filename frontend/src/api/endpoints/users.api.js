import api from '../axios.config';

/**
 * API de Usuarios
 * 
 * Endpoints para gestión de usuarios (CRUD)
 * Base path: /api/users
 */
export const usersApi = {
  // ============================================
  // CRUD USUARIOS
  // ============================================

  /**
   * Obtener todos los usuarios
   * GET /users
   * Requiere: users:read
   */
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Obtener usuario por username
   * GET /users/:username
   * Requiere: users:read
   */
  getByUsername: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  /**
   * Crear nuevo usuario
   * POST /users
   * Requiere: users:create
   */
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  /**
   * Actualizar usuario
   * PUT /users/:id
   * Requiere: users:update
   */
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Toggle estado enabled del usuario
   * PATCH /users/:id/toggle-enabled
   * Requiere: users:update
   */
  toggleEnabled: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/toggle-enabled`, { enabled });
    return response.data;
  },

  // ============================================
  // ROLES
  // ============================================

  /**
   * Obtener roles disponibles
   * GET /users/roles
   * Requiere: roles:read
   */
  getRoles: async () => {
    const response = await api.get('/users/roles');
    return response.data;
  },

  /**
   * Obtener usuarios que pueden ser revisores
   * GET /users/reviewers
   * Requiere: users:read
   */
  getReviewers: async () => {
    const response = await api.get('/users/reviewers');
    return response.data;
  },

  // ============================================
  // PERFIL (Usuario actual)
  // ============================================

  /**
   * Obtener perfil del usuario actual
   * GET /users/me
   */
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Actualizar perfil del usuario actual
   * PUT /users/me
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },

  // ============================================
  // TOTP (Autenticación de dos factores)
  // ============================================

  /**
   * Obtener QR code para configurar TOTP
   * GET /users/totp
   */
  getTotpQrCode: async () => {
    const response = await api.get('/users/totp');
    return response.data;
  },

  /**
   * Configurar TOTP
   * POST /users/totp
   */
  setupTotp: async (totpToken) => {
    const response = await api.post('/users/totp', { totpToken });
    return response.data;
  },

  /**
   * Cancelar/Desactivar TOTP
   * DELETE /users/totp
   */
  cancelTotp: async (totpToken) => {
    const response = await api.delete('/users/totp', { data: { totpToken } });
    return response.data;
  },
};

export default usersApi;