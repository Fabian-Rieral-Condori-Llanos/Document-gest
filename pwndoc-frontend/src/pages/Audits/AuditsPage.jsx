import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// Redux
import {
  fetchAudits,
  deleteAudit,
  selectAllAudits,
  selectAuditsLoading,
  selectAuditsError,
  selectFilteredAudits,
  selectAuditsFilters,
  setFilters,
  clearFilters,
  clearError,
} from '../../features/audits';
import { fetchCompanies, selectAllCompanies } from '../../features/companies/companiesSlice';
import { fetchLanguages, selectLanguages } from '../../features/data/dataSlice';

// Components
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  AuditCard,
  AuditFilters,
  AuditStats,
} from './components';

/**
 * AuditsPage - Página principal de listado de auditorías
 */
const AuditsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const audits = useSelector(selectAllAudits);
  const filteredAudits = useSelector(selectFilteredAudits);
  const filters = useSelector(selectAuditsFilters);
  const loading = useSelector(selectAuditsLoading);
  const error = useSelector(selectAuditsError);
  const companies = useSelector(selectAllCompanies);
  const languages = useSelector(selectLanguages);

  // Local state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchAudits());
    dispatch(fetchCompanies());
    dispatch(fetchLanguages());
  }, [dispatch]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Paginación
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAudits.slice(start, start + pageSize);
  }, [filteredAudits, currentPage, pageSize]);

  // Handlers
  const handleFilterChange = useCallback((newFilters) => {
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleCreateAudit = () => {
    navigate('/audits/create');
  };

  const handleRefresh = () => {
    dispatch(fetchAudits());
  };

  const handleDeleteClick = (auditId) => {
    setDeleteConfirm(auditId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    try {
      await dispatch(deleteAudit(deleteConfirm)).unwrap();
      setSuccessMessage('Auditoría eliminada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDuplicate = (auditId) => {
    // TODO: Implementar duplicación
    console.log('Duplicar auditoría:', auditId);
  };

  const handleCreateRetest = (auditId) => {
    navigate(`/audits/${auditId}/retest`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-400" />
              Evaluaciones
            </h1>
            <p className="text-gray-400 mt-1">
              Gestiona las auditorías de seguridad
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-bg-tertiary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={loading}
            />

            {/* Create */}
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreateAudit}
            >
              Nueva Auditoría
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-6">
            {successMessage}
          </Alert>
        )}

        {/* Stats */}
        <AuditStats audits={audits} className="mb-6" />

        {/* Filters */}
        <Card className="mb-6">
          <AuditFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            companies={companies}
            languages={languages}
          />
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {filteredAudits.length === audits.length ? (
              <>Mostrando {filteredAudits.length} auditoría{filteredAudits.length !== 1 ? 's' : ''}</>
            ) : (
              <>
                {filteredAudits.length} resultado{filteredAudits.length !== 1 ? 's' : ''} de {audits.length} auditoría{audits.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && audits.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4 animate-pulse">
                <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-400">Cargando auditorías...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAudits.length === 0 && (
          <Card className="py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {audits.length === 0 ? 'No hay auditorías' : 'Sin resultados'}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {audits.length === 0
                  ? 'Crea tu primera auditoría para comenzar a evaluar la seguridad.'
                  : 'No se encontraron auditorías con los filtros aplicados.'}
              </p>
              {audits.length === 0 ? (
                <Button variant="primary" icon={Plus} onClick={handleCreateAudit}>
                  Crear Auditoría
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Audits Grid/List */}
        {!loading && paginatedAudits.length > 0 && (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {paginatedAudits.map((audit) => (
                <AuditCard
                  key={audit._id}
                  audit={audit}
                  onDelete={handleDeleteClick}
                  onDuplicate={handleDuplicate}
                  onCreateRetest={handleCreateRetest}
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredAudits.length > pageSize && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredAudits.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[12, 24, 48, 96]}
                />
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-500/10 mb-4">
                  <AlertCircle className="w-6 h-6 text-danger-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  ¿Eliminar auditoría?
                </h3>
                <p className="text-gray-400 mb-6">
                  Esta acción no se puede deshacer. Se eliminarán todos los hallazgos y datos asociados.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
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

export default AuditsPage;