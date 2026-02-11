import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUsers, 
  fetchRoles,
  toggleUserEnabled
} from '../../features/users/usersThunks';
import { 
  selectFilteredUsers, 
  selectUsersLoading, 
  selectUsersError,
  selectRoles,
  selectTogglingUsers,
  setFilters,
  clearFilters 
} from '../../features/users';
import { useRoleCheck } from '../../routes/RoleGuard';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/Pagination';
import ToggleSwitch from '../../components/common/ToggleSwitch/ToggleSwitch';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Shield,
  Mail,
  UserCheck,
  X,
  RefreshCw,
  Power
} from 'lucide-react';

/**
 * UsersPage - Página de gestión de usuarios con paginación
 * Solo accesible para administradores
 */
const UsersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useRoleCheck();
  
  // Redux state
  const users = useSelector(selectFilteredUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const roles = useSelector(selectRoles);
  const togglingUsers = useSelector(selectTogglingUsers);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar usuarios y roles al montar
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  // Aplicar filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm, role: selectedRole }));
      setCurrentPage(1); // Reset a primera página al filtrar
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, dispatch]);

  // Calcular items paginados
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, pageSize]);

  // Reset página si excede el total
  useEffect(() => {
    const totalPages = Math.ceil(users.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [users.length, pageSize, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    dispatch(clearFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchUsers());
  };

  const handleCreateUser = () => {
    navigate('/users/create');
  };

  const handleEditUser = (username) => {
    navigate(`/users/${username}/edit`);
  };

  const handleToggleEnabled = async (userId, currentEnabled) => {
    try {
      await dispatch(toggleUserEnabled({ id: userId, enabled: !currentEnabled })).unwrap();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Obtener color del badge según rol
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-danger-500/10 text-danger-400 border-danger-500/20';
      case 'user':
        return 'bg-primary-500/10 text-primary-400 border-primary-500/20';
      case 'report':
        return 'bg-info-500/10 text-info-400 border-info-500/20';
      case 'analyst':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const hasFilters = searchTerm || selectedRole;

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary-400" />
              Usuarios
            </h1>
            <p className="text-gray-400 mt-1">
              Gestión de usuarios del sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={handleRefresh}
              disabled={loading}
            >
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            
            {isAdmin && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleCreateUser}
              >
                Nuevo Usuario
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Filtro por rol */}
            <div className="flex items-center gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Todos los roles</option>
                {roles.map(role => (
                  <option key={role} value={role} className="capitalize">
                    {role}
                  </option>
                ))}
              </select>
              
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={handleClearFilters}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Info de resultados */}
          {hasFilters && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {users.length} resultado{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </Card>

        {/* Lista de usuarios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando usuarios...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-400">
              {hasFilters 
                ? 'Prueba con otros filtros de búsqueda' 
                : 'Comienza creando el primer usuario'}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {/* Header de tabla (solo desktop) */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Usuario</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Rol</div>
                <div className="col-span-1">2FA</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-1">Acciones</div>
              </div>
              
              {/* Lista paginada de usuarios */}
              {paginatedUsers.map((user) => (
                <Card 
                  key={user._id} 
                  className={`hover:border-gray-600 transition-colors ${!user.enabled ? 'opacity-60' : ''}`}
                >
                  <div className="grid lg:grid-cols-12 gap-4 items-center">
                    {/* Usuario */}
                    <div className="lg:col-span-3 flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${user.enabled ? 'from-primary-500 to-primary-700' : 'from-gray-500 to-gray-700'} text-white font-semibold text-sm flex-shrink-0`}>
                        {user.firstname?.charAt(0)?.toUpperCase() || ''}
                        {user.lastname?.charAt(0)?.toUpperCase() || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0 hidden lg:block" />
                        <span className="truncate">{user.email || 'Sin email'}</span>
                      </div>
                    </div>
                    
                    {/* Rol */}
                    <div className="lg:col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </div>
                    
                    {/* 2FA Status */}
                    <div className="lg:col-span-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.totpEnabled 
                          ? 'bg-primary-500/10 text-primary-400' 
                          : 'bg-warning-500/10 text-warning-400'
                      }`}>
                        <UserCheck className="w-3 h-3" />
                        <span className="hidden xl:inline">{user.totpEnabled ? 'Sí' : 'No'}</span>
                      </span>
                    </div>
                    
                    {/* Estado (Toggle) */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <ToggleSwitch
                            checked={user.enabled !== false}
                            onChange={() => handleToggleEnabled(user._id, user.enabled !== false)}
                            loading={togglingUsers[user._id]}
                            size="sm"
                          />
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.enabled !== false
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            <Power className="w-3 h-3" />
                            {user.enabled !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                        <span className={`text-xs ${user.enabled !== false ? 'text-green-400' : 'text-red-400'}`}>
                          {user.enabled !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="lg:col-span-1 flex justify-end">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleEditUser(user.username)}
                        >
                          <span className="lg:hidden">Editar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;