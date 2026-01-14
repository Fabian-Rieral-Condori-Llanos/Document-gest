import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSelectors';
import { getProfile } from '../../features/auth/authThunks';
import { authApi } from '../../api/endpoints/auth.api';
import { usersApi } from '../../api/endpoints/users.api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  Key,
  Smartphone,
  CheckCircle,
  XCircle,
  QrCode,
  RefreshCw
} from 'lucide-react';

/**
 * ProfilePage - Página de perfil del usuario actual
 */
const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // TOTP State
  const [totpQrCode, setTotpQrCode] = useState(null);
  const [totpToken, setTotpToken] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  
  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setProfileData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authApi.updateProfile(profileData);
      await dispatch(getProfile());
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.data || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validaciones
    if (passwordData.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    try {
      await authApi.updateProfile({
        password: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.data || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  // TOTP Functions
  const handleGetTotpQr = async () => {
    setTotpLoading(true);
    setError('');
    
    try {
      const response = await usersApi.getTotpQrCode();
      setTotpQrCode(response.data.totpQrCode);
      console.log('TOTP QR Code data:', response.data);
    } catch (err) {
      setError(err.response?.data?.data || 'Error al obtener código QR');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleSetupTotp = async (e) => {
    e.preventDefault();
    setTotpLoading(true);
    setError('');
    
    try {
      await usersApi.setupTotp(totpToken);
      await dispatch(getProfile());
      setSuccess('Autenticación 2FA activada correctamente');
      setTotpQrCode(null);
      setTotpToken('');
    } catch (err) {
      setError(err.response?.data?.data || 'Código TOTP inválido');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleCancelTotp = async () => {
    if (!window.confirm('¿Estás seguro de desactivar la autenticación 2FA?')) {
      return;
    }
    
    const token = prompt('Ingresa tu código TOTP actual para confirmar:');
    if (!token) return;
    
    setTotpLoading(true);
    setError('');
    
    try {
      await usersApi.cancelTotp(token);
      await dispatch(getProfile());
      setSuccess('Autenticación 2FA desactivada');
    } catch (err) {
      setError(err.response?.data?.data || 'Error al desactivar 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: '2fa', label: '2FA', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <User className="w-8 h-8 text-primary-400" />
            Mi Perfil
          </h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu información personal y seguridad
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-6" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Info del usuario */}
          <div className="lg:col-span-1">
            <Card className="text-center">
              {/* Avatar */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-2xl mx-auto mb-4">
                {user?.firstname?.charAt(0)?.toUpperCase() || ''}
                {user?.lastname?.charAt(0)?.toUpperCase() || ''}
              </div>
              
              <h3 className="text-lg font-semibold text-white">
                {user?.firstname} {user?.lastname}
              </h3>
              <p className="text-gray-400 text-sm">@{user?.username}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-danger-500/10 text-danger-400' 
                    : 'bg-primary-500/10 text-primary-400'
                }`}>
                  <Shield className="w-4 h-4" />
                  <span className="capitalize">{user?.role}</span>
                </span>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Key className="w-4 h-4" />
                  <span>2FA: {user?.totpEnabled ? 'Activado' : 'Desactivado'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-primary-400 border-primary-400'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <Card>
                <h3 className="text-lg font-medium text-white mb-4">
                  Información Personal
                </h3>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre"
                      name="firstname"
                      value={profileData.firstname}
                      onChange={handleProfileChange}
                      icon={User}
                    />
                    
                    <Input
                      label="Apellido"
                      name="lastname"
                      value={profileData.lastname}
                      onChange={handleProfileChange}
                      icon={User}
                    />
                    
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      icon={Mail}
                    />
                    
                    <Input
                      label="Teléfono"
                      name="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      icon={Phone}
                    />
                    <Input
                      label="Contraseña Actual"
                      name="password"
                      type="password"
                      value={profileData.password}
                      onChange={handleProfileChange}
                      icon={Lock}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      loading={loading}
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <h3 className="text-lg font-medium text-white mb-4">
                  Cambiar Contraseña
                </h3>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Lock}
                      loading={loading}
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === '2fa' && (
              <Card>
                <h3 className="text-lg font-medium text-white mb-4">
                  Autenticación de Dos Factores (2FA)
                </h3>
                
                <div className="space-y-6">
                  {/* Status actual */}
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    user?.totpEnabled 
                      ? 'bg-primary-500/10 border border-primary-500/20' 
                      : 'bg-warning-500/10 border border-warning-500/20'
                  }`}>
                    {user?.totpEnabled ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-primary-400" />
                        <div>
                          <p className="font-medium text-white">2FA Activado</p>
                          <p className="text-sm text-gray-400">
                            Tu cuenta está protegida con autenticación de dos factores
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-warning-400" />
                        <div>
                          <p className="font-medium text-white">2FA Desactivado</p>
                          <p className="text-sm text-gray-400">
                            Activa la autenticación de dos factores para mayor seguridad
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Acciones */}
                  {user?.totpEnabled ? (
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={handleCancelTotp}
                      loading={totpLoading}
                    >
                      Desactivar 2FA
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {!totpQrCode ? (
                        <Button
                          variant="primary"
                          icon={QrCode}
                          onClick={handleGetTotpQr}
                          loading={totpLoading}
                        >
                          Configurar 2FA
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-gray-300 mb-4">
                              Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
                            </p>
                            <div className="inline-block p-4 bg-white rounded-lg">
                              <img 
                                src={totpQrCode.qrcode || totpQrCode} 
                                alt="TOTP QR Code" 
                                className="w-48 h-48"
                              />
                            </div>
                          </div>
                          
                          <form onSubmit={handleSetupTotp} className="max-w-sm mx-auto">
                            <Input
                              label="Código de verificación"
                              value={totpToken}
                              onChange={(e) => setTotpToken(e.target.value)}
                              placeholder="123456"
                              maxLength={6}
                              className="text-center text-2xl tracking-widest"
                            />
                            
                            <div className="flex gap-3 mt-4">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setTotpQrCode(null);
                                  setTotpToken('');
                                }}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                variant="primary"
                                loading={totpLoading}
                                className="flex-1"
                              >
                                Verificar
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;