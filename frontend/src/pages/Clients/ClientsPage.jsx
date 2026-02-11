import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchClients,
  deleteClient,
  selectFilteredClients,
  selectClientsLoading,
  selectClientsError,
  setFilters,
  clearFilters,
  clearError,
} from '../../features/clients';
import { fetchCompanies, selectAllCompanies } from '../../features/companies';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';

/**
 * ClientsPage - Página de gestión de entidades/clientes con paginación
 */
const ClientsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const clients = useSelector(selectFilteredClients);
  const companies = useSelector(selectAllCompanies);
  const loading = useSelector(selectClientsLoading);
  const error = useSelector(selectClientsError);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Aplicar filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm, company: selectedCompany }));
      setCurrentPage(1); // Reset a primera página al filtrar
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCompany, dispatch]);

  // Calcular items paginados
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return clients.slice(startIndex, endIndex);
  }, [clients, currentPage, pageSize]);

  // Reset página si excede el total
  useEffect(() => {
    const totalPages = Math.ceil(clients.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [clients.length, pageSize, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompany('');
    dispatch(clearFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchClients());
    dispatch(fetchCompanies());
  };

  const handleCreate = () => {
    navigate('/clients/create');
  };

  const handleEdit = (id) => {
    navigate(`/clients/${id}/edit`);
  };

  const handleDeleteClick = (client) => {
    setDeleteModal({ open: true, client });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.client) {
      await dispatch(deleteClient(deleteModal.client._id));
      setDeleteModal({ open: false, client: null });
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

  const getCompanyName = (company) => {
    if (!company) return 'Sin empresa';
    if (typeof company === 'object' && company.name) {
      return company.name;
    }
    if (typeof company === 'string') {
      const found = companies.find(c => c._id === company);
      return found?.name || 'Sin empresa';
    }
    return 'Sin empresa';
  };

  const hasFilters = searchTerm || selectedCompany;

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary-400" />
              Entidades
            </h1>
            <p className="text-gray-400 mt-1">
              Gestión de clientes y contactos
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

            <Button variant="primary" icon={Plus} onClick={handleCreate}>
              Nueva Entidad
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
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
                  placeholder="Buscar por nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Filtro por empresa */}
            <div className="flex items-center gap-3">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Info de resultados */}
          {hasFilters && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {clients.length} resultado{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </Card>

        {/* Lista de clientes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando entidades...</p>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <Card className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No se encontraron entidades
            </h3>
            <p className="text-gray-400 mb-4">
              {hasFilters
                ? 'Prueba con otros filtros de búsqueda'
                : 'Comienza creando la primera entidad'}
            </p>
            {!hasFilters && (
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Crear Entidad
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {/* Header de tabla (solo desktop) */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Contacto</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Teléfono</div>
                <div className="col-span-2">Empresa</div>
                <div className="col-span-2">Acciones</div>
              </div>

              {/* Lista paginada */}
              {paginatedClients.map((client) => (
                <Card key={client._id} className="hover:border-gray-600 transition-colors">
                  <div className="grid lg:grid-cols-12 gap-4 items-center">
                    {/* Contacto */}
                    <div className="lg:col-span-3 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-info-500 to-info-700 text-white font-semibold text-sm flex-shrink-0">
                        {client.firstname?.charAt(0)?.toUpperCase() || ''}
                        {client.lastname?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {client.firstname || client.lastname
                            ? `${client.firstname || ''} ${client.lastname || ''}`.trim()
                            : 'Sin nombre'}
                        </p>
                        {client.title && (
                          <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {client.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{client.phone || client.cell || '-'}</span>
                      </div>
                    </div>

                    {/* Empresa */}
                    <div className="lg:col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20">
                        <Building2 className="w-3 h-3" />
                        {getCompanyName(client.company)}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="lg:col-span-2 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEdit(client._id)}
                      >
                        <span className="lg:hidden">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteClick(client)}
                        className="text-danger-400 hover:bg-danger-500/10"
                      >
                        <span className="lg:hidden">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalItems={clients.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-500/10 mb-4">
                  <AlertTriangle className="w-6 h-6 text-danger-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Eliminar Entidad
                </h3>
                <p className="text-gray-400 mb-6">
                  ¿Estás seguro de eliminar a{' '}
                  <span className="text-white font-medium">
                    {deleteModal.client?.firstname} {deleteModal.client?.lastname}
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteModal({ open: false, client: null })}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={handleDeleteConfirm}
                    loading={loading}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;