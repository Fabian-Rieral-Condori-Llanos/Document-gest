import { createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../../api/endpoints/users.api';

/**
 * Users Thunks
 * 
 * Acciones asíncronas para gestión de usuarios
 */

/**
 * Obtener todos los usuarios
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersApi.getAll();
      console.log('[usersThunks] Users fetched:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error fetching users:', error);
      const message = error.response?.data?.data || 'Error al obtener usuarios';
      return rejectWithValue(message);
    }
  }
);

/**
 * Obtener usuario por username
 */
export const fetchUserByUsername = createAsyncThunk(
  'users/fetchUserByUsername',
  async (username, { rejectWithValue }) => {
    try {
      const response = await usersApi.getByUsername(username);
      console.log('[usersThunks] User fetched:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error fetching user:', error);
      const message = error.response?.data?.data || 'Error al obtener usuario';
      return rejectWithValue(message);
    }
  }
);

/**
 * Crear nuevo usuario
 */
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('[usersThunks] Creating user:', userData.username);
      const response = await usersApi.create(userData);
      console.log('[usersThunks] User created:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error creating user:', error);
      const message = error.response?.data?.data || 'Error al crear usuario';
      return rejectWithValue(message);
    }
  }
);

/**
 * Actualizar usuario
 */
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      console.log('[usersThunks] Updating user:', id);
      const response = await usersApi.update(id, userData);
      console.log('[usersThunks] User updated:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error updating user:', error);
      const message = error.response?.data?.data || 'Error al actualizar usuario';
      return rejectWithValue(message);
    }
  }
);

/**
 * Obtener roles disponibles
 */
export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersApi.getRoles();
      console.log('[usersThunks] Roles fetched:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error fetching roles:', error);
      const message = error.response?.data?.data || 'Error al obtener roles';
      return rejectWithValue(message);
    }
  }
);

/**
 * Obtener revisores
 */
export const fetchReviewers = createAsyncThunk(
  'users/fetchReviewers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersApi.getReviewers();
      console.log('[usersThunks] Reviewers fetched:', response);
      return response.data;
    } catch (error) {
      console.error('[usersThunks] Error fetching reviewers:', error);
      const message = error.response?.data?.data || 'Error al obtener revisores';
      return rejectWithValue(message);
    }
  }
);

/**
 * Toggle estado enabled del usuario
 */
export const toggleUserEnabled = createAsyncThunk(
  'users/toggleUserEnabled',
  async ({ id, enabled }, { rejectWithValue }) => {
    try {
      console.log('[usersThunks] Toggling user enabled:', id, enabled);
      const response = await usersApi.toggleEnabled(id, enabled);
      console.log('[usersThunks] User toggled:', response);
      return { id, enabled, data: response.data };
    } catch (error) {
      console.error('[usersThunks] Error toggling user:', error);
      const message = error.response?.data?.data || 'Error al cambiar estado del usuario';
      return rejectWithValue(message);
    }
  }
);