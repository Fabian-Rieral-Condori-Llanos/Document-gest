import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchUserByUsername, 
  createUser, 
  updateUser,
  fetchRoles 
} from '../../features/users/usersThunks';
import { 
  selectSelectedUser, 
  selectUsersLoading, 
  selectUsersError,
  selectRoles,
  clearSelectedUser,
  clearError
} from '../../features/users';
import { useRoleCheck } from '../../routes/RoleGuard';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import {
  User,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock
} from 'lucide-react';

/**
 * UserFormPage - Página para crear o editar usuario
 */
const UserFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { username } = useParams();
  const { isAdmin } = useRoleCheck();
  
  const isEditMode = Boolean(username);
  
  // Redux state
  const selectedUser = useSelector(selectSelectedUser);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const roles = useSelector(selectRoles);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar roles al montar
  useEffect(() => {
    dispatch(fetchRoles());
    
    return () => {
      dispatch(clearSelectedUser());
      dispatch(clearError());
    };
  }, [dispatch]);

  // Cargar usuario si estamos en modo edición
  useEffect(() => {
    if (isEditMode && username) {
      dispatch(fetchUserByUsername(username));
    }
  }, [isEditMode, username, dispatch]);

  // Llenar formulario con datos del usuario
  useEffect(() => {
    if (isEditMode && selectedUser) {
      setFormData({
        username: selectedUser.username || '',
        firstname: selectedUser.firstname || '',
        lastname: selectedUser.lastname || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        role: selectedUser.role || 'user',
        password: '',
        confirmPassword: '',
      });
    }
  }, [selectedUser, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error de validación al editar
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (!formData.firstname.trim()) {
      errors.firstname = 'El nombre es requerido';
    }
    
    if (!formData.lastname.trim()) {
      errors.lastname = 'El apellido es requerido';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    // Password solo requerida en creación
    if (!isEditMode) {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else {
      // En edición, validar solo si se ingresó contraseña
      if (formData.password) {
        if (formData.password.length < 8) {
          errors.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Las contraseñas no coinciden';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      const userData = {
        username: formData.username,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
      };
      
      // Solo incluir password si se proporcionó
      if (formData.password) {
        userData.password = formData.password;
      }
      
      if (isEditMode) {
        await dispatch(updateUser({ 
          id: selectedUser._id, 
          userData 
        })).unwrap();
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        await dispatch(createUser(userData)).unwrap();
        setSuccessMessage('Usuario creado correctamente');
        
        // Redirigir después de crear
        setTimeout(() => {
          navigate('/users');
        }, 1500);
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
    }
  };

  const handleBack = () => {
    navigate('/users');
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={handleBack}
          />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-primary-400" />
              {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode 
                ? `Editando: ${selectedUser?.username || username}` 
                : 'Crear un nuevo usuario en el sistema'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-400" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="usuario123"
                  error={validationErrors.username}
                  disabled={isEditMode}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Rol
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                      disabled={!isAdmin}
                    >
                      {roles.map(role => (
                        <option key={role} value={role} className="capitalize">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <Input
                  label="Nombre"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Juan"
                  error={validationErrors.firstname}
                  required
                />
                
                <Input
                  label="Apellido"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Pérez"
                  error={validationErrors.lastname}
                  required
                />
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-info-400" />
                Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  error={validationErrors.email}
                  icon={Mail}
                />
                
                <Input
                  label="Teléfono"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+591 12345678"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-warning-400" />
                {isEditMode ? 'Cambiar Contraseña (opcional)' : 'Contraseña'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {isEditMode ? 'Nueva Contraseña' : 'Contraseña'}
                    {!isEditMode && <span className="text-danger-400 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        validationErrors.password 
                          ? 'border-danger-500 focus:border-danger-500' 
                          : 'border-gray-700 focus:border-primary-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-danger-400">{validationErrors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirmar Contraseña
                    {!isEditMode && <span className="text-danger-400 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                        validationErrors.confirmPassword 
                          ? 'border-danger-500 focus:border-danger-500' 
                          : 'border-gray-700 focus:border-primary-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-danger-400">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
              
              {isEditMode && (
                <p className="mt-2 text-sm text-gray-400">
                  Deja los campos vacíos si no deseas cambiar la contraseña.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={loading}
              >
                {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UserFormPage;