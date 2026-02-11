import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Landmark,
  ArrowLeft,
  Save,
  Building2,
  Image,
  Upload,
  X,
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  FolderOpen,
  ClipboardList,
  FileCheck,
  FileClock,
  FileWarning,
  ScrollText,
} from 'lucide-react';
import { companiesApi } from '../../api/endpoints/companies.api';

/**
 * Constantes de categorías y niveles
 */
const NIVELES = {
  CENTRAL: 'CENTRAL',
  TERRITORIAL: 'TERRITORIAL'
};

const CATEGORIAS_POR_NIVEL = {
  CENTRAL: [
    { value: 'MINISTERIO', label: 'Ministerio' },
    { value: 'UNIVERSIDAD', label: 'Universidad' },
    { value: 'DESCONCENTRADO', label: 'Desconcentrado' },
    { value: 'EMPRESA_CENTRAL', label: 'Empresa Central' },
    { value: 'DESCENTRALIZADO', label: 'Descentralizado' },
  ],
  TERRITORIAL: [
    { value: 'GOBERNACION', label: 'Gobernación' },
    { value: 'EMPRESA_GOBERNACION', label: 'Empresa de Gobernación' },
    { value: 'MUNICIPIO', label: 'Municipio' },
    { value: 'EMPRESA_MUNICIPAL', label: 'Empresa Municipal' },
  ]
};

const TIPOS_DOCUMENTO = [
  { key: 'pisi', label: 'PISI', icon: Shield, requiereCite: true, color: 'emerald' },
  { key: 'actualizacionPisi', label: 'Actualización PISI', icon: FileCheck, requiereCite: true, color: 'blue' },
  { key: 'borradorPisi', label: 'Borrador PISI', icon: FileClock, requiereCite: false, color: 'amber' },
  { key: 'seguimientoPisi', label: 'Seguimiento PISI', icon: ClipboardList, requiereCite: true, color: 'purple' },
  { key: 'borradorPlanContingencia', label: 'Borrador Plan Contingencia', icon: FileWarning, requiereCite: false, color: 'orange' },
  { key: 'planContingencia', label: 'Plan de Contingencia', icon: ScrollText, requiereCite: true, color: 'cyan' },
  { key: 'informeTecnico', label: 'Informe Técnico', icon: FileText, requiereCite: true, color: 'indigo' },
];

/**
 * Componente Badge de Estado
 */
const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
    active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
  }`}>
    {active ? <CheckCircle size={12} /> : <XCircle size={12} />}
    {active ? 'Activo' : 'Inactivo'}
  </span>
);

/**
 * Componente Toggle Switch
 */
const Toggle = ({ checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <div className="relative mt-0.5">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-10 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-gray-600'
      }`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`} />
      </div>
    </div>
    <div>
      <div className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
        {label}
      </div>
      {description && <div className="text-xs text-gray-500">{description}</div>}
    </div>
  </label>
);

/**
 * Componente para un documento individual
 */
const DocumentoItem = ({ documento, tipo, onEdit, onDelete, requiereCite }) => {
  const fecha = documento.fecha ? new Date(documento.fecha).toLocaleDateString('es-BO') : 'Sin fecha';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg border border-gray-700 group hover:border-gray-600 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {requiereCite && documento.cite && (
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-mono rounded">
              {documento.cite}
            </span>
          )}
          <span className="text-xs text-gray-500">{fecha}</span>
        </div>
        {documento.descripcion && (
          <p className="text-sm text-gray-300 truncate">{documento.descripcion}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(documento)}
          className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
          title="Editar"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete(documento._id)}
          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * Componente para gestionar documentos de un tipo
 */
const DocumentosSection = ({ 
  tipo, 
  label, 
  icon: Icon, 
  color,
  documentos = [], 
  gestionActual,
  requiereCite,
  onAgregar,
  onEditar,
  onEliminar,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    gestion: gestionActual,
    fecha: '',
    cite: '',
    descripcion: ''
  });

  // Filtrar documentos por gestión actual
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => doc.gestion === gestionActual);
  }, [documentos, gestionActual]);

  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      gestion: gestionActual,
      fecha: formData.fecha || undefined,
      descripcion: formData.descripcion || undefined,
    };
    
    if (requiereCite) {
      data.cite = formData.cite || undefined;
    }

    if (editingDoc) {
      await onEditar(tipo, editingDoc._id, data);
      setEditingDoc(null);
    } else {
      await onAgregar(tipo, data);
    }
    
    setFormData({ gestion: gestionActual, fecha: '', cite: '', descripcion: '' });
    setIsAdding(false);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      gestion: doc.gestion,
      fecha: doc.fecha ? doc.fecha.split('T')[0] : '',
      cite: doc.cite || '',
      descripcion: doc.descripcion || ''
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingDoc(null);
    setFormData({ gestion: gestionActual, fecha: '', cite: '', descripcion: '' });
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <h4 className="font-medium">{label}</h4>
          <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
            {documentosFiltrados.length}
          </span>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Agregar documento"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Lista de documentos */}
      {documentosFiltrados.length > 0 && !isAdding && (
        <div className="space-y-2 mb-3">
          {documentosFiltrados.map((doc) => (
            <DocumentoItem
              key={doc._id}
              documento={doc}
              tipo={tipo}
              requiereCite={requiereCite}
              onEdit={handleEdit}
              onDelete={(docId) => onEliminar(tipo, docId)}
            />
          ))}
        </div>
      )}

      {/* Mensaje si no hay documentos */}
      {documentosFiltrados.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 text-center py-4">
          Sin documentos en gestión {gestionActual}
        </p>
      )}

      {/* Formulario */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-bg-secondary rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            {requiereCite && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">CITE</label>
                <input
                  type="text"
                  value={formData.cite}
                  onChange={(e) => setFormData(prev => ({ ...prev, cite: e.target.value }))}
                  placeholder="AGETIC-001/2025"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del documento..."
              rows={2}
              className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <Check size={14} />
              {editingDoc ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/**
 * CompanyFormPage - Página para crear o editar empresa con gestión por año
 */
const CompanyFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const isEditMode = Boolean(id);
  const currentYear = new Date().getFullYear();

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [gestionActual, setGestionActual] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('info');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    logo: '',
    status: true,
    cuadroDeMando: false,
    nivelDeMadurez: '',
    nivel: 'CENTRAL',
    categoria: '',
  });

  // Documentos (se cargan del servidor)
  const [company, setCompany] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Cargar empresa si estamos en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadCompany();
    }
  }, [isEditMode, id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.getFullById(id);
      const data = response.data;
      
      setCompany(data);
      setFormData({
        name: data.name || '',
        shortName: data.shortName || '',
        logo: data.logo || '',
        status: data.status !== false,
        cuadroDeMando: data.cuadroDeMando || false,
        nivelDeMadurez: data.nivelDeMadurez || '',
        nivel: data.nivel || 'CENTRAL',
        categoria: data.categoria || '',
      });
      setLogoPreview(data.logo || '');
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si cambia el nivel, limpiar la categoría
    if (name === 'nivel') {
      setFormData((prev) => ({ ...prev, nivel: value, categoria: '' }));
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationErrors((prev) => ({ ...prev, logo: 'El archivo debe ser una imagen' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, logo: 'La imagen no debe superar 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logo: reader.result }));
      setLogoPreview(reader.result);
      setValidationErrors((prev) => ({ ...prev, logo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }));
    setLogoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      setError(null);

      const companyData = {
        name: formData.name,
        shortName: formData.shortName || undefined,
        logo: formData.logo || undefined,
        status: formData.status,
        cuadroDeMando: formData.cuadroDeMando,
        nivelDeMadurez: formData.nivelDeMadurez || undefined,
        nivel: formData.nivel,
        categoria: formData.categoria || undefined,
      };

      if (isEditMode) {
        await companiesApi.update(id, companyData);
        setSuccess('Empresa actualizada correctamente');
      } else {
        await companiesApi.create(companyData);
        setSuccess('Empresa creada correctamente');
      }

      setTimeout(() => navigate('/companies'), 1000);
    } catch (err) {
      console.error('Error saving company:', err);
      setError(err.response?.data?.data || 'Error al guardar la empresa');
    } finally {
      setSaving(false);
    }
  };

  // Handlers para documentos
  const handleAgregarDocumento = async (tipo, documento) => {
    try {
      setSaving(true);
      await companiesApi.agregarDocumento(id, tipo, documento);
      await loadCompany();
      setSuccess('Documento agregado correctamente');
    } catch (err) {
      setError('Error al agregar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleEditarDocumento = async (tipo, docId, documento) => {
    try {
      setSaving(true);
      await companiesApi.actualizarDocumento(id, tipo, docId, documento);
      await loadCompany();
      setSuccess('Documento actualizado correctamente');
    } catch (err) {
      setError('Error al actualizar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarDocumento = async (tipo, docId) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;
    
    try {
      setSaving(true);
      await companiesApi.eliminarDocumento(id, tipo, docId);
      await loadCompany();
      setSuccess('Documento eliminado correctamente');
    } catch (err) {
      setError('Error al eliminar documento');
    } finally {
      setSaving(false);
    }
  };

  // Tabs
  const tabs = [
    { key: 'info', label: 'Información', icon: Building2 },
    { key: 'documentos', label: 'Documentos', icon: FolderOpen, disabled: !isEditMode },
  ];

  const categoriasDisponibles = CATEGORIAS_POR_NIVEL[formData.nivel] || [];

  // Generar años para el selector de gestión
  const years = [];
  for (let y = currentYear; y >= 2020; y--) years.push(y);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 rounded-lg hover:bg-bg-secondary text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
              <Landmark className="w-8 h-8 text-primary-400" />
              {isEditMode ? 'Editar Empresa' : 'Nueva Empresa'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode ? `Editando: ${formData.name}` : 'Crear nueva empresa u organización'}
            </p>
          </div>
          {isEditMode && <StatusBadge active={formData.status} />}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-emerald-400 flex-shrink-0" size={20} />
            <p className="text-emerald-300 flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-300">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Selector de Gestión (solo en modo edición) */}
        {isEditMode && (
          <div className="mb-6 flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary-400" size={20} />
              <div>
                <span className="text-sm text-gray-400">Gestión</span>
                <p className="text-xs text-gray-500">Los documentos se filtran por año</p>
              </div>
            </div>
            <select
              value={gestionActual}
              onChange={(e) => setGestionActual(parseInt(e.target.value))}
              className="px-4 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white font-medium focus:outline-none focus:border-primary-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-bg-secondary p-1 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => !tab.disabled && setActiveTab(tab.key)}
                disabled={tab.disabled}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white'
                    : tab.disabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Información */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit}>
            <div className="bg-bg-secondary rounded-xl border border-gray-800 p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="text-primary-400" size={20} />
                  Información Básica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Agencia de Gobierno Electrónico..."
                      className={`w-full px-4 py-2.5 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-700'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sigla / Nombre Corto
                    </label>
                    <input
                      type="text"
                      name="shortName"
                      value={formData.shortName}
                      onChange={handleChange}
                      placeholder="AGETIC"
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nivel de Madurez
                    </label>
                    <input
                      type="text"
                      name="nivelDeMadurez"
                      value={formData.nivelDeMadurez}
                      onChange={handleChange}
                      placeholder="Nivel 3 - Definido"
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Clasificación */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="text-amber-400" size={20} />
                  Clasificación
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nivel Organizacional
                    </label>
                    <select
                      name="nivel"
                      value={formData.nivel}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="CENTRAL">Central</option>
                      <option value="TERRITORIAL">Territorial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoría
                    </label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {categoriasDisponibles.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Opciones */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="text-emerald-400" size={20} />
                  Opciones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Toggle
                    checked={formData.status}
                    onChange={(v) => handleToggleChange('status', v)}
                    label="Estado Activo"
                    description="Indica si la empresa está activa en el sistema"
                  />

                  <Toggle
                    checked={formData.cuadroDeMando}
                    onChange={(v) => handleToggleChange('cuadroDeMando', v)}
                    label="Cuadro de Mando"
                    description="Prioridad en dashboards y estadísticas"
                  />
                </div>
              </div>

              {/* Logo */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Image className="text-blue-400" size={20} />
                  Logo
                </h3>

                {logoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-24 h-24 rounded-lg object-cover bg-bg-tertiary border border-gray-700"
                    />
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Logo actual</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">Clic para subir imagen</p>
                    <p className="text-sm text-gray-500">PNG, JPG hasta 2MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                {validationErrors.logo && (
                  <p className="mt-2 text-sm text-red-400">{validationErrors.logo}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/companies')}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isEditMode ? 'Guardar Cambios' : 'Crear Empresa'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab: Documentos */}
        {activeTab === 'documentos' && isEditMode && (
          <div className="space-y-4">
            <div className="bg-bg-secondary rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3 text-amber-400">
                <Calendar size={20} />
                <p className="text-sm">
                  Mostrando documentos de la gestión <strong>{gestionActual}</strong>. 
                  Los documentos nuevos se agregarán a esta gestión.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TIPOS_DOCUMENTO.map((tipo) => (
                <DocumentosSection
                  key={tipo.key}
                  tipo={tipo.key}
                  label={tipo.label}
                  icon={tipo.icon}
                  color={tipo.color}
                  requiereCite={tipo.requiereCite}
                  documentos={company?.[tipo.key] || []}
                  gestionActual={gestionActual}
                  onAgregar={handleAgregarDocumento}
                  onEditar={handleEditarDocumento}
                  onEliminar={handleEliminarDocumento}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyFormPage;