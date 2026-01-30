import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';
import Modal from '../../../components/common/Modal/Modal';

// Secciones predefinidas comunes en reportes de pentesting
const PREDEFINED_SECTIONS = [
  { field: 'executive_summary', name: 'Resumen Ejecutivo', description: 'Resumen de alto nivel para la dirección' },
  { field: 'scope', name: 'Alcance', description: 'Sistemas y aplicaciones evaluadas' },
  { field: 'methodology', name: 'Metodología', description: 'Metodología y herramientas utilizadas' },
  { field: 'timeline', name: 'Cronograma', description: 'Fechas y duración de la auditoría' },
  { field: 'classification', name: 'Clasificación', description: 'Sistema de clasificación de vulnerabilidades' },
  { field: 'summary_findings', name: 'Resumen de Hallazgos', description: 'Estadísticas y distribución de vulnerabilidades' },
  { field: 'recommendations', name: 'Recomendaciones Generales', description: 'Recomendaciones de seguridad generales' },
  { field: 'conclusion', name: 'Conclusión', description: 'Conclusiones finales de la auditoría' },
  { field: 'appendix', name: 'Anexos', description: 'Información adicional y referencias' },
];

/**
 * SectionsTab - Gestión de secciones del reporte de auditoría
 */
const SectionsTab = ({ auditId }) => {
  // State
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // UI State
  const [expandedSections, setExpandedSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  
  // Form State
  const [sectionForm, setSectionForm] = useState({
    field: '',
    name: '',
    text: '',
  });

  // Cargar datos
  useEffect(() => {
    loadSections();
  }, [auditId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await auditsApi.getAuditSections(auditId);
      setSections(response.data || []);
    } catch (err) {
      setError('Error al cargar secciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expansión
  const toggleSection = (index) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Expandir/colapsar todas
  const toggleAllSections = (expand) => {
    const newState = {};
    sections.forEach((_, idx) => {
      newState[idx] = expand;
    });
    setExpandedSections(newState);
  };

  // ============================================
  // CRUD
  // ============================================

  const openAddModal = (predefined = null) => {
    if (predefined) {
      setSectionForm({
        field: predefined.field,
        name: predefined.name,
        text: '',
      });
    } else {
      setSectionForm({ field: '', name: '', text: '' });
    }
    setShowAddModal(true);
  };

  const openEditModal = (section, index) => {
    setSectionForm({
      field: section.field || '',
      name: section.name || '',
      text: section.text || '',
    });
    setEditingSection({ ...section, index });
    setShowEditModal(true);
  };

  const openDeleteModal = (section, index) => {
    setSectionToDelete({ ...section, index });
    setShowDeleteModal(true);
  };

  const handleCreateSection = async () => {
    if (!sectionForm.field.trim() || !sectionForm.name.trim()) {
      setError('El identificador y nombre son requeridos');
      return;
    }

    // Verificar que no exista
    if (sections.some(s => s.field === sectionForm.field)) {
      setError('Ya existe una sección con ese identificador');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await auditsApi.createAuditSection(auditId, sectionForm);
      await loadSections();
      setShowAddModal(false);
      setSuccess('Sección creada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear sección');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!sectionForm.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await auditsApi.updateAuditSection(auditId, editingSection._id, {
        name: sectionForm.name,
        text: sectionForm.text,
      });
      await loadSections();
      setShowEditModal(false);
      setEditingSection(null);
      setSuccess('Sección actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar sección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    try {
      setSaving(true);
      setError('');
      await auditsApi.deleteAuditSection(auditId, sectionToDelete._id);
      await loadSections();
      setShowDeleteModal(false);
      setSectionToDelete(null);
      setSuccess('Sección eliminada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar sección');
    } finally {
      setSaving(false);
    }
  };

  // Guardar contenido inline (sin modal)
  const handleSaveInline = async (section, newText) => {
    try {
      setSaving(true);
      await auditsApi.updateAuditSection(auditId, section._id, {
        name: section.name,
        text: newText,
      });
      await loadSections();
      setSuccess('Contenido guardado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Obtener secciones predefinidas no utilizadas
  const getAvailablePredefined = () => {
    const usedFields = new Set(sections.map(s => s.field));
    return PREDEFINED_SECTIONS.filter(p => !usedFields.has(p.field));
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Card className="py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400">Cargando secciones...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError('')}>{error}</Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>
      )}

      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Secciones del Reporte</h3>
              <p className="text-sm text-gray-400">
                {sections.length} sección(es) definida(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sections.length > 0 && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleAllSections(true)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Expandir
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleAllSections(false)}
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Colapsar
                </Button>
              </>
            )}
            <Button variant="primary" icon={Plus} onClick={() => openAddModal()}>
              Nueva Sección
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Add Predefined */}
      {getAvailablePredefined().length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Agregar sección predefinida</h4>
          <div className="flex flex-wrap gap-2">
            {getAvailablePredefined().map(predefined => (
              <button
                key={predefined.field}
                onClick={() => openAddModal(predefined)}
                className="px-3 py-1.5 bg-bg-tertiary border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-primary-500 transition-colors"
                title={predefined.description}
              >
                + {predefined.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {sections.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Sin secciones</h3>
            <p className="text-gray-400 mb-4">
              Agrega secciones para estructurar tu reporte de auditoría
            </p>
            <Button variant="primary" icon={Plus} onClick={() => openAddModal()}>
              Crear Primera Sección
            </Button>
          </div>
        </Card>
      ) : (
        /* Sections List */
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <SectionItem
              key={section._id || idx}
              section={section}
              index={idx}
              isExpanded={expandedSections[idx]}
              onToggle={() => toggleSection(idx)}
              onEdit={() => openEditModal(section, idx)}
              onDelete={() => openDeleteModal(section, idx)}
              onSave={(newText) => handleSaveInline(section, newText)}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Add Section Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nueva Sección"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Identificador <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={sectionForm.field}
                onChange={(e) => setSectionForm({ ...sectionForm, field: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="executive_summary"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Usado internamente, sin espacios</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nombre <span className="text-danger-400">*</span>
              </label>
              <input
                type="text"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="Resumen Ejecutivo"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contenido
            </label>
            <textarea
              value={sectionForm.text}
              onChange={(e) => setSectionForm({ ...sectionForm, text: e.target.value })}
              placeholder="Escribe el contenido de la sección..."
              rows={10}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleCreateSection} isLoading={saving}>
              Crear Sección
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingSection(null); }}
        title="Editar Sección"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Identificador
            </label>
            <input
              type="text"
              value={sectionForm.field}
              disabled
              className="w-full px-4 py-2.5 bg-bg-secondary border border-gray-700 rounded-lg text-gray-400 font-mono text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre <span className="text-danger-400">*</span>
            </label>
            <input
              type="text"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="Nombre de la sección"
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contenido
            </label>
            <textarea
              value={sectionForm.text}
              onChange={(e) => setSectionForm({ ...sectionForm, text: e.target.value })}
              placeholder="Escribe el contenido de la sección..."
              rows={12}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingSection(null); }}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleUpdateSection} isLoading={saving}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSectionToDelete(null); }}
        title="Eliminar Sección"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Estás seguro de que deseas eliminar la sección <strong className="text-white">"{sectionToDelete?.name}"</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer y se perderá todo el contenido.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setSectionToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteSection} isLoading={saving}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * SectionItem - Componente individual de sección
 */
const SectionItem = ({ section, index, isExpanded, onToggle, onEdit, onDelete, onSave, saving }) => {
  const [localText, setLocalText] = useState(section.text || '');
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar cuando cambia la sección
  useEffect(() => {
    setLocalText(section.text || '');
    setHasChanges(false);
  }, [section.text]);

  const handleTextChange = (e) => {
    setLocalText(e.target.value);
    setHasChanges(e.target.value !== (section.text || ''));
  };

  const handleSaveClick = () => {
    onSave(localText);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setLocalText(section.text || '');
    setHasChanges(false);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <FileText className="w-5 h-5 text-accent-400" />
          <div>
            <h4 className="text-white font-medium">{section.name}</h4>
            <p className="text-xs text-gray-500 font-mono">{section.field}</p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {hasChanges && (
            <span className="text-xs text-warning-400 mr-2">Sin guardar</span>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-secondary rounded"
            title="Editar sección"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-danger-400 hover:bg-bg-secondary rounded"
            title="Eliminar sección"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4">
          <textarea
            value={localText}
            onChange={handleTextChange}
            placeholder="Escribe el contenido de esta sección..."
            rows={8}
            className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-y"
          />
          
          {hasChanges && (
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                Descartar
              </Button>
              <Button variant="primary" size="sm" icon={Save} onClick={handleSaveClick} isLoading={saving}>
                Guardar
              </Button>
            </div>
          )}
          
          {!hasChanges && localText && (
            <p className="text-xs text-gray-500 mt-2">
              {localText.length} caracteres
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default SectionsTab;