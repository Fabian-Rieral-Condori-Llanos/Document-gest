import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchVulnerabilities,
  fetchVulnerabilityCategories,
  deleteVulnerability,
  deleteManyVulnerabilities,
  selectFilteredVulnerabilities,
  selectVulnerabilitiesLoading,
  selectVulnerabilitiesError,
  selectVulnerabilityCategories,
  selectSelectedIds,
  selectVulnerabilitiesFilters,
  setFilters,
  clearFilters,
  clearError,
  toggleSelectId,
  selectAllIds,
  clearSelectedIds,
  getVulnDetails,
  PRIORITY_MAP,
} from '../../features/vulnerabilities';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Pagination from '../../components/common/Pagination/Pagination';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  FileText,
} from 'lucide-react';

/**
 * VulnerabilitiesPage - Base de Conocimiento de Vulnerabilidades con paginación
 */
const VulnerabilitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const vulnerabilities = useSelector(selectFilteredVulnerabilities);
  const categories = useSelector(selectVulnerabilityCategories);
  const loading = useSelector(selectVulnerabilitiesLoading);
  const error = useSelector(selectVulnerabilitiesError);
  const selectedIds = useSelector(selectSelectedIds);
  const filters = useSelector(selectVulnerabilitiesFilters);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, vuln: null, bulk: false });
  const [showFilters, setShowFilters] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cargar datos al montar
  useEffect(() => {
    dispatch(fetchVulnerabilities());
    dispatch(fetchVulnerabilityCategories());
  }, [dispatch]);

  // Aplicar filtros con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ 
        search: searchTerm, 
        category: selectedCategory,
        priority: selectedPriority 
      }));
      setCurrentPage(1); // Reset a primera página al filtrar
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedPriority, dispatch]);

  // Calcular items paginados
  const paginatedVulnerabilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return vulnerabilities.slice(startIndex, endIndex);
  }, [vulnerabilities, currentPage, pageSize]);

  // Reset página si excede el total
  useEffect(() => {
    const totalPages = Math.ceil(vulnerabilities.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [vulnerabilities.length, pageSize, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    dispatch(clearFilters());
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchVulnerabilities());
    dispatch(fetchVulnerabilityCategories());
  };

  const handleCreate = () => {
    navigate('/vulnerabilities/create');
  };

  const handleEdit = (id) => {
    navigate(`/vulnerabilities/${id}/edit`);
  };

  const handleView = (id) => {
    navigate(`/vulnerabilities/${id}`);
  };

  const handleDeleteClick = (vuln) => {
    setDeleteModal({ open: true, vuln, bulk: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteModal({ open: true, vuln: null, bulk: true });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.bulk) {
      await dispatch(deleteManyVulnerabilities(selectedIds));
    } else if (deleteModal.vuln) {
      await dispatch(deleteVulnerability(deleteModal.vuln._id));
    }
    setDeleteModal({ open: false, vuln: null, bulk: false });
  };

  const handleToggleSelect = (id) => {
    dispatch(toggleSelectId(id));
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedVulnerabilities.map(v => v._id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Deseleccionar solo los de la página actual
      currentPageIds.forEach(id => {
        if (selectedIds.includes(id)) {
          dispatch(toggleSelectId(id));
        }
      });
    } else {
      // Seleccionar todos los de la página actual
      dispatch(selectAllIds([...new Set([...selectedIds, ...currentPageIds])]));
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

  // Obtener badge de prioridad
  const getPriorityBadge = (priority) => {
    const p = PRIORITY_MAP[priority];
    if (!p) return null;
    
    const colors = {
      danger: 'bg-danger-500/10 text-danger-400 border-danger-500/20',
      warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
      info: 'bg-info-500/10 text-info-400 border-info-500/20',
      success: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[p.color]}`}>
        {p.label}
      </span>
    );
  };

  const locale = filters.locale || 'es';
  const hasActiveFilters = searchTerm || selectedCategory || selectedPriority;
  const currentPageIds = paginatedVulnerabilities.map(v => v._id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-danger-400" />
              Base de Conocimiento
            </h1>
            <p className="text-gray-400 mt-1">
              Gestión de vulnerabilidades y hallazgos
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
              Nueva Vulnerabilidad
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
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, descripción, CVSS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botón de filtros */}
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Limpiar
                </Button>
              )}
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="">Todas las prioridades</option>
                    {Object.entries(PRIORITY_MAP).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Info de resultados */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  {vulnerabilities.length} resultado{vulnerabilities.length !== 1 ? 's' : ''} encontrado{vulnerabilities.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Acciones en lote */}
        {selectedIds.length > 0 && (
          <Card className="mb-4 bg-primary-500/5 border-primary-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white">
                {selectedIds.length} vulnerabilidad{selectedIds.length !== 1 ? 'es' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(clearSelectedIds())}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={handleBulkDeleteClick}
                >
                  Eliminar seleccionadas
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de vulnerabilidades */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-danger-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Cargando vulnerabilidades...</p>
            </div>
          </div>
        ) : vulnerabilities.length === 0 ? (
          <Card className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No se encontraron vulnerabilidades
            </h3>
            <p className="text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Prueba con otros filtros de búsqueda'
                : 'Comienza creando la primera vulnerabilidad'}
            </p>
            {!hasActiveFilters && (
              <Button variant="primary" icon={Plus} onClick={handleCreate}>
                Crear Vulnerabilidad
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {/* Header de tabla */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors"
                    title={allCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar página'}
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="col-span-5">Título</div>
                <div className="col-span-2">Categoría</div>
                <div className="col-span-1">Prioridad</div>
                <div className="col-span-1">CVSS</div>
                <div className="col-span-2">Acciones</div>
              </div>

              {/* Lista paginada */}
              {paginatedVulnerabilities.map((vuln) => {
                const details = getVulnDetails(vuln, locale);
                const isSelected = selectedIds.includes(vuln._id);
                
                return (
                  <Card 
                    key={vuln._id} 
                    className={`hover:border-gray-600 transition-colors ${isSelected ? 'border-primary-500/50 bg-primary-500/5' : ''}`}
                  >
                    <div className="grid lg:grid-cols-12 gap-4 items-center">
                      {/* Checkbox */}
                      <div className="lg:col-span-1">
                        <button
                          onClick={() => handleToggleSelect(vuln._id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Título */}
                      <div className="lg:col-span-5">
                        <button
                          onClick={() => handleView(vuln._id)}
                          className="text-left group"
                        >
                          <p className="font-medium text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                            {details?.title || 'Sin título'}
                          </p>
                          {details?.vulnType && (
                            <p className="text-sm text-gray-500 mt-1">
                              {details.vulnType}
                            </p>
                          )}
                        </button>
                      </div>

                      {/* Categoría */}
                      <div className="lg:col-span-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20">
                          {vuln.category || 'Sin categoría'}
                        </span>
                      </div>

                      {/* Prioridad */}
                      <div className="lg:col-span-1">
                        {getPriorityBadge(vuln.priority)}
                      </div>

                      {/* CVSS */}
                      <div className="lg:col-span-1">
                        <span className="text-sm text-gray-300 font-mono">
                          {vuln.cvssv3 ? vuln.cvssv3.split('/')[0].replace('CVSS:3.1/', '') : '-'}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="lg:col-span-2 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FileText}
                          onClick={() => handleView(vuln._id)}
                          title="Ver detalles"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleEdit(vuln._id)}
                          title="Editar"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteClick(vuln)}
                          className="text-danger-400 hover:bg-danger-500/10"
                          title="Eliminar"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalItems={vulnerabilities.length}
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
                  {deleteModal.bulk ? 'Eliminar Vulnerabilidades' : 'Eliminar Vulnerabilidad'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {deleteModal.bulk ? (
                    <>¿Estás seguro de eliminar <span className="text-white font-medium">{selectedIds.length}</span> vulnerabilidades? Esta acción no se puede deshacer.</>
                  ) : (
                    <>¿Estás seguro de eliminar esta vulnerabilidad? Esta acción no se puede deshacer.</>
                  )}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteModal({ open: false, vuln: null, bulk: false })}
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

export default VulnerabilitiesPage;