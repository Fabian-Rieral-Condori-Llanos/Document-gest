import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectCurrentUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError,
  selectRequiresTOTP,
  selectIsAdmin,
} from '../features/auth/authSelectors';
import { 
  login as loginThunk, 
  loginWithTOTP as loginWithTOTPThunk,
  logout as logoutThunk,
  createFirstUser as createFirstUserThunk,
  checkInit as checkInitThunk,
  getProfile as getProfileThunk,
} from '../features/auth/authThunks';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const requiresTOTP = useSelector(selectRequiresTOTP);
  const isAdmin = useSelector(selectIsAdmin);
  
  const login = async (credentials) => {
    const result = await dispatch(loginThunk(credentials));
    
    // Solo redirigir si no hay error y no requiere TOTP
    if (!result.error && result.payload !== 'TOTP_REQUIRED') {
      navigate('/dashboard', { replace: true });
    }
    
    return result;
  };
  
  const loginWithTOTP = async (credentials) => {
    const result = await dispatch(loginWithTOTPThunk(credentials));
    
    if (!result.error) {
      navigate('/dashboard', { replace: true });
    }
    
    return result;
  };
  
  const logout = async () => {
    // Hacer logout (el thunk maneja todo)
    await dispatch(logoutThunk());
    
    // Redirigir
    navigate('/login', { replace: true });
  };
  
  const createFirstUser = async (userData) => {
    const result = await dispatch(createFirstUserThunk(userData));
    
    if (!result.error) {
      navigate('/dashboard', { replace: true });
    }
    
    return result;
  };
  
  const checkInit = async () => {
    return await dispatch(checkInitThunk());
  };
  
  const getProfile = async () => {
    return await dispatch(getProfileThunk());
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    requiresTOTP,
    isAdmin,
    login,
    loginWithTOTP,
    logout,
    createFirstUser,
    checkInit,
    getProfile,
  };
};