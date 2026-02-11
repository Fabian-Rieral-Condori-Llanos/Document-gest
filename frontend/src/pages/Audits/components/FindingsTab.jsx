import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Import,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// Redux
import { moveAuditFinding } from '../../../features/audits';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import FindingsImportModal from './FindingsImportModal';

// Utils
const getSeverityFromCvss = (cvssVector) => {
  if (!cvssVector) return { score: null, label: 'N/A', color: 'bg-gray-500' };
  
  // Extraer score aproximado
  let score = null;
  
  if (cvssVector.startsWith('CVSS:3.1/')) {
    const metrics = {};
    cvssVector.replace('CVSS:3.1/', '').split('/').forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) metrics[key] = value;
    });
    
    const { AV, AC, PR, UI, C, I, A } = metrics;
    if (AV && C) {
      score = 5.0;
      if (AV === 'N') score += 2;
      if (AC === 'L') score += 1;
      if (PR === 'N') score += 0.5;
      if (UI === 'N') score += 0.5;
      if (C === 'H') score += 0.5;
      if (I === 'H') score += 0.3;
      if (A === 'H') score += 0.2;
      score = Math.min(score, 10);
    }
  }
  
  if (score === null) return { score: null, label: 'N/A', color: 'bg-gray-500' };
  if (score === 0) return { score, label: 'Info', color: 'bg-gray-500' };
  if (score <= 3.9) return { score, label: 'Baja', color: 'bg-success-500' };
  if (score <= 6.9) return { score, label: 'Media', color: 'bg-warning-500' };
  if (score <= 8.9) return { score, label: 'Alta', color: 'bg-danger-500' };
  return { score, label: 'Crítica', color: 'bg-danger-700' };
};

/**
 * FindingsTab - Tab de hallazgos mejorado con filtros e importación
 */
const FindingsTab = ({
  auditId,
  findings = [],
  findingsLoading = false,
  language = 'es',
  onRefresh,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Local state
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    severity: '',
  });

  // Obtener categorías únicas de los findings
  const categories = useMemo(() => {
    const cats = new Set(findings.map(f => f.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [findings]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = findings.length;
    const completed = findings.filter(f => f.status === 0).length;
    const redacting = findings.filter(f => f.status === 1).length;
    
    // Contar por severidad
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    findings.forEach(f => {
      const sev = getSeverityFromCvss(f.cvssv3 || f.cvssv4);
      if (sev.label === 'Crítica') bySeverity.critical++;
      else if (sev.label === 'Alta') bySeverity.high++;
      else if (sev.label === 'Media') bySeverity.medium++;
      else if (sev.label === 'Baja') bySeverity.low++;
      else bySeverity.info++;
    });
    
    return { total, completed, redacting, bySeverity };
  }, [findings]);

  // Filtrar findings
  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      // Búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const title = (finding.title || '').toLowerCase();
        const category = (finding.category || '').toLowerCase();
        if (!title.includes(search) && !category.includes(search)) {
          return false;
        }
      }
      
      // Filtro de estado
      if (filters.status !== '') {
        if (finding.status !== Number(filters.status)) return false;
      }
      
      // Filtro de categoría
      if (filters.category && finding.category !== filters.category) {
        return false;
      }
      
      // Filtro de severidad
      if (filters.severity) {
        const sev = getSeverityFromCvss(finding.cvssv3 || finding.cvssv4);
        if (sev.label.toLowerCase() !== filters.severity.toLowerCase()) {
          return false;
        }
      }
      
      return true;
    });
  }, [findings, searchTerm, filters]);

  const handleImportSuccess = () => {
    if (onRefresh) onRefresh();
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', severity: '' });
    setSearchTerm('');
  };

  const handleMoveFinding = async (findingId, direction) => {
    const currentIndex = findings.findIndex(f => (f._id || f.id) === findingId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Validar límites
    if (newIndex < 0 || newIndex >= findings.length) return;
    
    setMovingId(findingId);
    try {
      await dispatch(moveAuditFinding({ auditId, findingId, newIndex })).unwrap();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error moving finding:', error);
    } finally {
      setMovingId(null);
    }
  };

  const hasActiveFilters = searchTerm || filters.status !== '' || filters.category || filters.severity;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-bg-tertiary rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="bg-danger-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-danger-400">{stats.bySeverity.critical}</p>
          <p className="text-xs text-gray-400">Críticas</p>
        </div>
        <div className="bg-danger-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-danger-300">{stats.bySeverity.high}</p>
          <p className="text-xs text-gray-400">Altas</p>
        </div>
        <div className="bg-warning-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-warning-400">{stats.bySeverity.medium}</p>
          <p className="text-xs text-gray-400">Medias</p>
        </div>
        <div className="bg-success-500/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-success-400">{stats.bySeverity.low + stats.bySeverity.info}</p>
          <p className="text-xs text-gray-400">Bajas/Info</p>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar hallazgos..."
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                : 'bg-bg-tertiary border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </button>
          
          {/* Reorder Toggle */}
          <button
            onClick={() => setReorderMode(!reorderMode)}
            disabled={hasActiveFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              reorderMode
                ? 'bg-accent-500/10 border-accent-500 text-accent-400'
                : 'bg-bg-tertiary border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title={hasActiveFilters ? 'Desactiva los filtros para reordenar' : 'Activar modo reordenar'}
          >
            <GripVertical className="w-4 h-4" />
            <span className="hidden sm:inline">{reorderMode ? 'Listo' : 'Ordenar'}</span>
          </button>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Import}
              onClick={() => setShowImportModal(true)}
            >
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => navigate(`/audits/${auditId}/findings/create`)}
            >
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="1">Redactando</option>
                  <option value="0">Completado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Severidad
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Todas</option>
                  <option value="crítica">Crítica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Findings List */}
      <Card>
        {findingsLoading ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500/10 mb-3">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">Cargando hallazgos...</p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">
              {hasActiveFilters 
                ? 'No se encontraron hallazgos con los filtros aplicados'
                : 'No hay hallazgos registrados'
              }
            </p>
            {!hasActiveFilters && (
              <p className="text-sm text-gray-500 mb-4">
                Agrega hallazgos manualmente o importa desde la biblioteca
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    icon={Import}
                    onClick={() => setShowImportModal(true)}
                  >
                    Importar
                  </Button>
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => navigate(`/audits/${auditId}/findings/create`)}
                  >
                    Crear Hallazgo
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredFindings.map((finding, idx) => {
              const severity = getSeverityFromCvss(finding.cvssv3 || finding.cvssv4);
              const findingId = finding._id || finding.id;
              const isMoving = movingId === findingId;
              const isFirst = idx === 0;
              const isLast = idx === filteredFindings.length - 1;
              
              return (
                <div
                  key={findingId || idx}
                  className={`p-4 hover:bg-bg-tertiary transition-colors ${reorderMode ? '' : 'cursor-pointer'} ${isMoving ? 'opacity-50' : ''}`}
                  onClick={() => !reorderMode && navigate(`/audits/${auditId}/findings/${findingId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Reorder Controls */}
                    {reorderMode && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveFinding(findingId, 'up');
                          }}
                          disabled={isFirst || isMoving}
                          className="p-1 text-gray-400 hover:text-white hover:bg-bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveFinding(findingId, 'down');
                          }}
                          disabled={isLast || isMoving}
                          className="p-1 text-gray-400 hover:text-white hover:bg-bg-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-500 font-mono">
                          #{finding.identifier || idx + 1}
                        </span>
                        <h4 className="text-white font-medium truncate">
                          {finding.title || 'Sin título'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {finding.category && (
                          <span className="px-2 py-0.5 bg-bg-secondary rounded text-xs text-gray-400">
                            {finding.category}
                          </span>
                        )}
                        {finding.vulnType && (
                          <span className="text-xs text-gray-500">
                            {finding.vulnType}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Severity Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${severity.color}`}>
                        {severity.score !== null ? severity.score.toFixed(1) : 'N/A'}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        finding.status === 0 
                          ? 'bg-success-500/10 text-success-400' 
                          : 'bg-warning-500/10 text-warning-400'
                      }`}>
                        {finding.status === 0 ? 'Completado' : 'Redactando'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Footer con conteo */}
        {filteredFindings.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-500">
            Mostrando {filteredFindings.length} de {findings.length} hallazgos
          </div>
        )}
      </Card>

      {/* Import Modal */}
      <FindingsImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        auditId={auditId}
        language={language}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default FindingsTab;