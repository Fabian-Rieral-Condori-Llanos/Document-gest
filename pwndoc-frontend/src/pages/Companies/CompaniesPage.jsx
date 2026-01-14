import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCompanies,
  deleteCompany,
  selectFilteredCompanies,
  selectCompaniesLoading,
  selectCompaniesError,
  setFilters,
  clearFilters,
  clearError,
} from '../../features/companies';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  Landmark,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';

/**
 * CompaniesPage - Página de gestión de empresas con paginación
 */
const CompaniesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const companies = useSelector(selectFilteredCompanies);
  const loading = useSelector(selectCompaniesLoading);
  const error = useSelector(selectCompaniesError);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, company: null });
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Aplicar filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm }));
      setCurrentPage(1); // Reset a primera página al filtrar
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  // Calcular items paginados
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return companies.slice(startIndex, endIndex);
  }, [companies, currentPage, pageSize]);

  // Reset página si excede el total
  useEffect(() => {
    const totalPages = Math.ceil(companies.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [companies.length, pageSize, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchCompanies());
  };

  const handleCreate = () => {
    navigate('/companies/create');
  };

  const handleEdit = (id) => {
    navigate(`/companies/${id}/edit`);
  };

  const handleDeleteClick = (company) => {
    setDeleteModal({ open: true, company });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.company) {
      await dispatch(deleteCompany(deleteModal.company._id));
      setDeleteModal({ open: false, company: null });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Landmark className="w-8 h-8 text-accent-400" />
              Empresas
            </h1>
            <p className="text-gray-400 mt-1">
              Gestión de empresas y organizaciones
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
              Nueva Empresa
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
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {searchTerm && (
              <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Info de resultados */}
          {searchTerm && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                {companies.length} resultado{companies.length !== 1 ? 's' : ''} para "{searchTerm}"
              </p>
            </div>
          )}
        </Card>

        {/* Lista de empresas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando empresas...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <Card className="text-center py-12">
            <Landmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm
                ? 'Prueba con otros términos de búsqueda'
                : 'Comienza creando la primera empresa'}
            </p>
            {!searchTerm && (
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Crear Empresa
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCompanies.map((company) => (
                <Card
                  key={company._id}
                  className="hover:border-accent-500/30 transition-all cursor-pointer group"
                  onClick={() => handleEdit(company._id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Logo o placeholder */}
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-16 h-16 rounded-lg object-cover bg-bg-tertiary"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent-500/20 to-accent-700/20 flex items-center justify-center">
                          <Landmark className="w-8 h-8 text-accent-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-accent-400 transition-colors">
                        {company.name}
                      </h3>
                      {company.shortName && (
                        <p className="text-sm text-gray-400 truncate">
                          {company.shortName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(company._id);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(company);
                      }}
                      className="text-danger-400 hover:bg-danger-500/10"
                    >
                      Eliminar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalItems={companies.length}
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
                  Eliminar Empresa
                </h3>
                <p className="text-gray-400 mb-6">
                  ¿Estás seguro de eliminar{' '}
                  <span className="text-white font-medium">
                    {deleteModal.company?.name}
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteModal({ open: false, company: null })}
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

export default CompaniesPage;