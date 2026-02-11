import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSelectors';

const PrivateRoute = ({ children, requiredPermission }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere permiso específico, verificar
  if (requiredPermission) {
    const hasPermission = user?.role === 'admin' || user?.permissions?.includes(requiredPermission);
    
    if (!hasPermission) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
};

export default PrivateRoute;