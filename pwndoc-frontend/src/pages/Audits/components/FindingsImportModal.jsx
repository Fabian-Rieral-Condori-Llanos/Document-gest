import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Import,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Redux
import {
  fetchVulnerabilities,
  selectAllVulnerabilities,
  selectVulnerabilitiesLoading,
} from '../../../features/vulnerabilities';
import {
  fetchVulnerabilityCategories,
  selectVulnerabilityCategories,
} from '../../../features/data/dataSlice';
import { importVulnerabilities } from '../../../features/audits';

// Components
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';

// Utils
const getSeverityInfo = (cvssScore) => {
  if (cvssScore === null || cvssScore === undefined) {
    return { label: 'N/A', color: 'bg-gray-500', textColor: 'text-gray-400' };
  }
  if (cvssScore === 0) return { label: 'Info', color: 'bg-gray-500', textColor: 'text-gray-400' };
  if (cvssScore <= 3.9) return { label: 'Baja', color: 'bg-success-500', textColor: 'text-success-400' };
  if (cvssScore <= 6.9) return { label: 'Media', color: 'bg-warning-500', textColor: 'text-warning-400' };
  if (cvssScore <= 8.9) return { label: 'Alta', color: 'bg-danger-500', textColor: 'text-danger-400' };
  return { label: 'Crítica', color: 'bg-danger-700', textColor: 'text-danger-300' };
};

const extractCvssScore = (vector) => {
  if (!vector) return null;
  
  // Intentar extraer score de CVSS 3.1
  if (vector.startsWith('CVSS:3.1/')) {
    // Cálculo simplificado - el backend tiene el cálculo completo
    const metrics = {};
    vector.replace('CVSS:3.1/', '').split('/').forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) metrics[key] = value;
    });
    
    // Estimación básica basada en métricas
    const { AV, AC, PR, UI, C, I, A } = metrics;
    if (!AV || !C) return null;
    
    let score = 5.0; // Base
    if (AV === 'N') score += 2;
    if (AC === 'L') score += 1;
    if (PR === 'N') score += 1;
    if (C === 'H' || I === 'H' || A === 'H') score += 1;
    
    return Math.min(score, 10);
  }
  
  return null;
};

/**
 * FindingsImportModal - Modal para importar vulnerabilidades de la biblioteca
 */
const FindingsImportModal = ({
  isOpen,
  onClose,
  auditId,
  language = 'es',
  onSuccess,
}) => {
  const dispatch = useDispatch();
  
  // Redux state
  const vulnerabilities = useSelector(selectAllVulnerabilities);
  const loading = useSelector(selectVulnerabilitiesLoading);
  const categories = useSelector(selectVulnerabilityCategories);
  
  // Local state
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchVulnerabilities());
      dispatch(fetchVulnerabilityCategories());
      // Reset state
      setSelectedIds([]);
      setSearchTerm('');
      setCategoryFilter('');
      setImportError('');
      setImportSuccess('');
    }
  }, [isOpen, dispatch]);

  // Filtrar vulnerabilidades
  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(vuln => {
      // Filtro de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const title = (vuln.details?.[language]?.title || vuln.details?.en?.title || '').toLowerCase();
        const vulnType = (vuln.details?.[language]?.vulnType || '').toLowerCase();
        
        if (!title.includes(search) && !vulnType.includes(search)) {
          return false;
        }
      }
      
      // Filtro de categoría
      if (categoryFilter && vuln.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });
  }, [vulnerabilities, searchTerm, categoryFilter, language]);

  // Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredVulnerabilities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVulnerabilities.map(v => v._id));
    }
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) return;
    
    setIsImporting(true);
    setImportError('');
    setImportSuccess('');
    
    try {
      await dispatch(importVulnerabilities({
        auditId,
        vulnerabilityIds: selectedIds,
        language
      })).unwrap();
      
      setImportSuccess(`${selectedIds.length} vulnerabilidad(es) importada(s) exitosamente`);
      setSelectedIds([]);
      
      // Callback de éxito
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error) {
      setImportError(error?.message || error || 'Error al importar vulnerabilidades');
    } finally {
      setIsImporting(false);
    }
  };

  const getVulnTitle = (vuln) => {

    if(Array.isArray(vuln.details) && vuln.details.length > 0){
        const firsDestail = vuln.details[0];
        const vulnTitle = firsDestail?.title || 'Sin título';
        return vulnTitle;
        }
        return 'Sin título';
    };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Vulnerabilidades"
      size="xl"
    >
      <div className="space-y-4">
        {/* Alerts */}
        {importError && (
          <Alert variant="error" onClose={() => setImportError('')}>
            {importError}
          </Alert>
        )}
        
        {importSuccess && (
          <Alert variant="success">
            {importSuccess}
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vulnerabilidades..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters || categoryFilter
                ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                : 'bg-bg-tertiary border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-bg-tertiary rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Selection Info */}
        <div className="flex items-center justify-between py-2 px-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.length === filteredVulnerabilities.length && filteredVulnerabilities.length > 0
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-600'
              }`}>
                {selectedIds.length === filteredVulnerabilities.length && filteredVulnerabilities.length > 0 && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              Seleccionar todo
            </button>
            <span className="text-gray-500">|</span>
            <span className="text-sm text-gray-400">
              {selectedIds.length} seleccionada(s) de {filteredVulnerabilities.length}
            </span>
          </div>
        </div>

        {/* Vulnerabilities List */}
        <div className="max-h-[400px] overflow-y-auto border border-gray-700 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredVulnerabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">No se encontraron vulnerabilidades</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Intenta con otros términos de búsqueda
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredVulnerabilities.map((vuln) => {
                const isSelected = selectedIds.includes(vuln._id);
                const cvssScore = extractCvssScore(vuln.cvssv3);
                const severity = getSeverityInfo(cvssScore);
                
                return (
                  <div
                    key={vuln._id}
                    onClick={() => handleToggleSelect(vuln._id)}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary-500/10' 
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-600'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">
                          {getVulnTitle(vuln)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {vuln.category && (
                          <span className="px-2 py-0.5 bg-bg-secondary rounded text-gray-400">
                            {vuln.category}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Severity Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${severity.color} text-white flex-shrink-0`}>
                      {cvssScore !== null ? cvssScore.toFixed(1) : 'N/A'} {severity.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>
          
          <Button
            variant="primary"
            icon={Import}
            onClick={handleImport}
            disabled={selectedIds.length === 0}
            isLoading={isImporting}
          >
            Importar {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FindingsImportModal;