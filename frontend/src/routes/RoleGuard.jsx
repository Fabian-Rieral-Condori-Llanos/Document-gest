import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSelectors';

/**
 * RoleGuard - Componente para proteger rutas según rol del usuario
 * 
 * @param {ReactNode} children - Componentes hijos a renderizar si tiene permiso
 * @param {string|string[]} allowedRoles - Rol o roles permitidos para acceder
 * @param {string} redirectTo - Ruta a la que redirigir si no tiene permiso (default: /forbidden)
 * @param {ReactNode} fallback - Componente alternativo a mostrar si no tiene permiso
 */
const RoleGuard = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/forbidden',
  fallback = null 
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalizar allowedRoles a array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Verificar si el usuario tiene uno de los roles permitidos
  const hasPermission = roles.includes(user?.role);

  // Admin siempre tiene acceso
  const isAdmin = user?.role === 'admin';

  if (!hasPermission && !isAdmin) {
    // Si hay fallback, mostrarlo en lugar de redirigir
    if (fallback) {
      return fallback;
    }
    
    // Redirigir a la página de acceso denegado
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

/**
 * AdminOnly - Shorthand para rutas solo de administrador
 */
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * Hook para verificar roles en componentes
 */
export const useRoleCheck = () => {
  const user = useSelector(selectCurrentUser);
  
  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin tiene todos los roles
    return user.role === role;
  };

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = (roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  /**
   * Verificar si es administrador
   */
  const isAdmin = user?.role === 'admin';

  /**
   * Verificar si es el mismo usuario
   */
  const isSelf = (userId) => user?._id === userId;

  /**
   * Verificar si puede editar un usuario (admin o self)
   */
  const canEditUser = (userId) => isAdmin || isSelf(userId);

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSelf,
    canEditUser,
  };
};

export default RoleGuard;