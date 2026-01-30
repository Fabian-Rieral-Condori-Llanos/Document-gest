import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Database,
  Plus,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  HardDrive,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileArchive,
  Search,
  Eye,
  X,
  Info,
} from 'lucide-react';
import {
  fetchBackups,
  fetchBackupStatus,
  fetchDiskUsage,
  createBackup,
  uploadBackup,
  restoreBackup,
  deleteBackup,
  downloadBackup,
  clearOperationState,
  selectBackups,
  selectBackupsLoading,
  selectOperationStatus,
  selectDiskUsage,
  selectBackupOperationLoading,
  selectBackupOperationError,
  selectBackupOperationSuccess,
} from '../../features/backups';
import Pagination from '../../components/common/Pagination/Pagination';

// Datos disponibles para backup
const BACKUP_DATA_OPTIONS = [
  { id: 'Audits', label: 'Auditorías', description: 'Evaluaciones de seguridad' },
  { id: 'Vulnerabilities', label: 'Vulnerabilidades', description: 'Base de conocimiento' },
  { id: 'Vulnerabilities Updates', label: 'Actualizaciones de Vulnerabilidades', description: 'Historial de cambios' },
  { id: 'Users', label: 'Usuarios', description: 'Cuentas de usuario' },
  { id: 'Clients', label: 'Entidades', description: 'Clientes/entidades' },
  { id: 'Companies', label: 'Empresas', description: 'Compañías auditoras' },
  { id: 'Templates', label: 'Plantillas', description: 'Plantillas de reportes' },
  { id: 'Audit Types', label: 'Tipos de Auditoría', description: 'Clasificación de auditorías' },
  { id: 'Custom Fields', label: 'Campos Personalizados', description: 'Campos adicionales' },
  { id: 'Custom Sections', label: 'Secciones Personalizadas', description: 'Secciones de reportes' },
  { id: 'Vulnerability Types', label: 'Tipos de Vulnerabilidad', description: 'Clasificación' },
  { id: 'Vulnerability Categories', label: 'Categorías de Vulnerabilidad', description: 'Agrupación' },
  { id: 'Settings', label: 'Configuración', description: 'Ajustes del sistema' },
];

/**
 * BackupsPage
 * 
 * Página para gestionar backups del sistema.
 */
const BackupsPage = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Redux state
  const backups = useSelector(selectBackups);
  const backupsLoading = useSelector(selectBackupsLoading);
  const operationStatus = useSelector(selectOperationStatus);
  const diskUsage = useSelector(selectDiskUsage);
  const operationLoading = useSelector(selectBackupOperationLoading);
  const operationError = useSelector(selectBackupOperationError);
  const operationSuccess = useSelector(selectBackupOperationSuccess);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // Form state para crear backup
  const [createForm, setCreateForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    backupData: BACKUP_DATA_OPTIONS.map(opt => opt.id),
  });

  // Form state para restaurar
  const [restoreForm, setRestoreForm] = useState({
    password: '',
    restoreData: [],
    mode: 'merge', // 'merge' o 'replace'
  });

  // Notificación
  const [notification, setNotification] = useState(null);

  // Polling para estado de operaciones
  const pollingRef = useRef(null);

  // Cargar datos iniciales
  useEffect(() => {
    dispatch(fetchBackups());
    dispatch(fetchDiskUsage());
    dispatch(fetchBackupStatus());
  }, [dispatch]);

  // Polling cuando hay operación en curso
  useEffect(() => {
    if (operationStatus.operation !== 'idle') {
      pollingRef.current = setInterval(() => {
        dispatch(fetchBackupStatus());
      }, 2000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        // Recargar backups cuando termine la operación
        dispatch(fetchBackups());
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [operationStatus.operation, dispatch]);

  // Mostrar notificaciones
  useEffect(() => {
    if (operationSuccess) {
      setNotification({ type: 'success', message: operationSuccess });
      dispatch(clearOperationState());
    }
    if (operationError) {
      setNotification({ type: 'error', message: operationError });
      dispatch(clearOperationState());
    }
  }, [operationSuccess, operationError, dispatch]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filtrar backups
  const filteredBackups = backups.filter(backup =>
    backup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar por fecha (más reciente primero)
  const sortedBackups = [...filteredBackups].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Paginación
  const totalItems = sortedBackups.length;
  const paginatedBackups = sortedBackups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Formatear bytes
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handlers
  const handleCreateBackup = async () => {
    if (createForm.password !== createForm.confirmPassword) {
      setNotification({ type: 'error', message: 'Las contraseñas no coinciden' });
      return;
    }

    await dispatch(createBackup({
      name: createForm.name || undefined,
      password: createForm.password || undefined,
      backupData: createForm.backupData,
    }));

    setShowCreateModal(false);
    setCreateForm({
      name: '',
      password: '',
      confirmPassword: '',
      backupData: BACKUP_DATA_OPTIONS.map(opt => opt.id),
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.tar')) {
      setNotification({ type: 'error', message: 'El archivo debe ser un .tar' });
      return;
    }

    await dispatch(uploadBackup(file));
    dispatch(fetchBackups());
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    await dispatch(restoreBackup({
      slug: selectedBackup.slug,
      data: {
        password: restoreForm.password || undefined,
        restoreData: restoreForm.restoreData,
        mode: restoreForm.mode,
      },
    }));

    setShowRestoreModal(false);
    setRestoreForm({ password: '', restoreData: [], mode: 'merge' });
    setSelectedBackup(null);
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    await dispatch(deleteBackup(selectedBackup.slug));
    setShowDeleteModal(false);
    setSelectedBackup(null);
  };

  const handleDownload = (backup) => {
    dispatch(downloadBackup({
      slug: backup.slug,
      filename: backup.filename,
    }));
  };

  const openRestoreModal = (backup) => {
    setSelectedBackup(backup);
    setRestoreForm({
      password: '',
      restoreData: backup.data || [],
      mode: 'merge',
    });
    setShowRestoreModal(true);
  };

  const openInfoModal = (backup) => {
    setSelectedBackup(backup);
    setShowInfoModal(true);
  };

  const toggleBackupDataOption = (optionId) => {
    setCreateForm(prev => ({
      ...prev,
      backupData: prev.backupData.includes(optionId)
        ? prev.backupData.filter(id => id !== optionId)
        : [...prev.backupData, optionId],
    }));
  };

  const toggleRestoreDataOption = (optionId) => {
    setRestoreForm(prev => ({
      ...prev,
      restoreData: prev.restoreData.includes(optionId)
        ? prev.restoreData.filter(id => id !== optionId)
        : [...prev.restoreData, optionId],
    }));
  };

  const selectAllBackupData = () => {
    setCreateForm(prev => ({
      ...prev,
      backupData: BACKUP_DATA_OPTIONS.map(opt => opt.id),
    }));
  };

  const deselectAllBackupData = () => {
    setCreateForm(prev => ({
      ...prev,
      backupData: [],
    }));
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
          notification.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-primary-400" />
            Backups del Sistema
          </h1>
          <p className="text-gray-400 mt-1">
            Gestiona las copias de seguridad de la plataforma
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón subir */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".tar"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={operationStatus.operation !== 'idle' || operationLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-gray-700 text-white rounded-xl hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Subir Backup
          </button>

          {/* Botón crear */}
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={operationStatus.operation !== 'idle' || operationLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Crear Backup
          </button>
        </div>
      </div>

      {/* Cards de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Estado de operación */}
        <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            {operationStatus.operation !== 'idle' ? (
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Estado</p>
              <p className="text-white font-medium capitalize">
                {operationStatus.operation === 'idle' ? 'Disponible' : operationStatus.operation}
              </p>
            </div>
          </div>
          {operationStatus.message && (
            <p className="text-xs text-gray-500 mt-2 truncate">{operationStatus.message}</p>
          )}
        </div>

        {/* Uso de disco */}
        <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Espacio Disponible</p>
              <p className="text-white font-medium">
                {diskUsage ? formatBytes(diskUsage.available) : '-'}
              </p>
            </div>
          </div>
          {diskUsage && (
            <div className="mt-2">
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-primary-500 rounded-full h-2 transition-all"
                  style={{
                    width: `${((diskUsage.total - diskUsage.available) / diskUsage.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(diskUsage.total - diskUsage.available)} usado de {formatBytes(diskUsage.total)}
              </p>
            </div>
          )}
        </div>

        {/* Total backups */}
        <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Backups</p>
              <p className="text-white font-medium">{backups.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar backups..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Lista de backups */}
      <div className="bg-bg-secondary border border-gray-700 rounded-xl overflow-hidden">
        {backupsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : paginatedBackups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay backups disponibles</p>
            <p className="text-sm text-gray-500 mt-1">
              Crea tu primer backup para proteger tus datos
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-tertiary border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Backup
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Encriptado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Datos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedBackups.map((backup) => (
                    <tr key={backup.slug} className="hover:bg-bg-tertiary/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                            <FileArchive className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {backup.name || backup.slug}
                            </p>
                            <p className="text-xs text-gray-500">{backup.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatDate(backup.date)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-300">{formatBytes(backup.size)}</span>
                      </td>
                      <td className="px-4 py-4">
                        {backup.encrypted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                            <Lock className="w-3 h-3" />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                            <Unlock className="w-3 h-3" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-300 text-sm">
                          {backup.data?.length || 0} elementos
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openInfoModal(backup)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
                            title="Ver información"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(backup)}
                            disabled={operationLoading}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRestoreModal(backup)}
                            disabled={operationStatus.operation !== 'idle' || operationLoading}
                            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Restaurar"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowDeleteModal(true);
                            }}
                            disabled={operationLoading}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-4 pb-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal Crear Backup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Crear Nuevo Backup</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Mi backup"
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Contraseña */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Datos a incluir */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Datos a incluir
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllBackupData}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Seleccionar todo
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={deselectAllBackupData}
                      className="text-xs text-gray-400 hover:text-gray-300"
                    >
                      Deseleccionar todo
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto bg-bg-tertiary rounded-lg p-3">
                  {BACKUP_DATA_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-secondary cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.backupData.includes(option.id)}
                        onChange={() => toggleBackupDataOption(option.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-bg-primary text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                      />
                      <div>
                        <p className="text-sm text-white">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={createForm.backupData.length === 0 || operationLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {operationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Crear Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restaurar */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Restaurar Backup</h2>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Advertencia */}
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Precaución</p>
                  <p className="text-sm text-yellow-400/80">
                    Restaurar un backup puede sobrescribir datos existentes. Asegúrate de tener un backup actual antes de continuar.
                  </p>
                </div>
              </div>

              {/* Info del backup */}
              <div className="p-4 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-gray-400">Restaurando desde:</p>
                <p className="text-white font-medium">{selectedBackup.name || selectedBackup.slug}</p>
                <p className="text-xs text-gray-500">{formatDate(selectedBackup.date)}</p>
              </div>

              {/* Contraseña si está encriptado */}
              {selectedBackup.encrypted && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Contraseña del backup
                  </label>
                  <input
                    type="password"
                    value={restoreForm.password}
                    onChange={(e) => setRestoreForm({ ...restoreForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}

              {/* Modo de restauración */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Modo de restauración
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    restoreForm.mode === 'merge'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="merge"
                      checked={restoreForm.mode === 'merge'}
                      onChange={() => setRestoreForm({ ...restoreForm, mode: 'merge' })}
                      className="w-4 h-4 text-primary-500"
                    />
                    <div>
                      <p className="text-white font-medium">Combinar</p>
                      <p className="text-xs text-gray-400">Agrega datos sin eliminar existentes</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    restoreForm.mode === 'replace'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="replace"
                      checked={restoreForm.mode === 'replace'}
                      onChange={() => setRestoreForm({ ...restoreForm, mode: 'replace' })}
                      className="w-4 h-4 text-red-500"
                    />
                    <div>
                      <p className="text-white font-medium">Reemplazar</p>
                      <p className="text-xs text-gray-400">Elimina datos existentes primero</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Datos a restaurar */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Datos a restaurar
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-bg-tertiary rounded-lg p-3">
                  {(selectedBackup.data || []).map((dataItem) => (
                    <label
                      key={dataItem}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-secondary cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={restoreForm.restoreData.includes(dataItem)}
                        onChange={() => toggleRestoreDataOption(dataItem)}
                        className="w-4 h-4 rounded border-gray-600 bg-bg-primary text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-white">{dataItem}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                disabled={restoreForm.restoreData.length === 0 || operationLoading || (selectedBackup.encrypted && !restoreForm.password)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {operationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Eliminar Backup</h2>
              <p className="text-gray-400 mb-4">
                ¿Estás seguro de que deseas eliminar el backup <strong className="text-white">{selectedBackup.name || selectedBackup.slug}</strong>?
              </p>
              <p className="text-sm text-red-400 mb-6">Esta acción no se puede deshacer.</p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={operationLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {operationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Info */}
      {showInfoModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Información del Backup</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Nombre</p>
                  <p className="text-white">{selectedBackup.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Slug</p>
                  <p className="text-white font-mono text-sm">{selectedBackup.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Fecha</p>
                  <p className="text-white">{formatDate(selectedBackup.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tamaño</p>
                  <p className="text-white">{formatBytes(selectedBackup.size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Encriptado</p>
                  <p className="text-white">{selectedBackup.encrypted ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Archivo</p>
                  <p className="text-white text-sm truncate">{selectedBackup.filename}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Datos incluidos</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedBackup.data || []).map((item) => (
                    <span
                      key={item}
                      className="px-2 py-1 bg-bg-tertiary text-sm text-gray-300 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end p-4 border-t border-gray-700">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-bg-tertiary text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupsPage;