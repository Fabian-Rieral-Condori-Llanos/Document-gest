import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Network,
  Plus,
  Trash2,
  Edit,
  Server,
  Globe,
  Monitor,
  ChevronDown,
  ChevronRight,
  Save,
  Upload
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';
import Modal from '../../../components/common/Modal/Modal';

/**
 * NetworkTab - Gestión del alcance/scope de la auditoría
 */
const NetworkTab = ({ auditId }) => {
  // State
  const [scope, setScope] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // UI State
  const [expandedScopes, setExpandedScopes] = useState({});
  const [expandedHosts, setExpandedHosts] = useState({});
  
  // Modal States
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBulkHostsModal, setShowBulkHostsModal] = useState(false);
  const [showBulkServicesModal, setShowBulkServicesModal] = useState(false);
  const [editingScopeIndex, setEditingScopeIndex] = useState(null);
  const [editingHostIndex, setEditingHostIndex] = useState(null);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [currentScopeIndex, setCurrentScopeIndex] = useState(null);
  const [currentHostIndex, setCurrentHostIndex] = useState(null);
  
  // Form States
  const [scopeForm, setScopeForm] = useState({ name: '' });
  const [hostForm, setHostForm] = useState({ hostname: '', ip: '', os: '' });
  const [serviceForm, setServiceForm] = useState({ 
    port: '', protocol: 'tcp', name: '', product: '', version: '' 
  });
  
  // Bulk Import States
  const [bulkHostsText, setBulkHostsText] = useState('');
  const [bulkServicesText, setBulkServicesText] = useState('');
  const [bulkPreview, setBulkPreview] = useState([]);

  // Cargar datos
  useEffect(() => {
    loadNetwork();
  }, [auditId]);

  const loadNetwork = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await auditsApi.getAuditNetwork(auditId);
      setScope(response.data?.scope || []);
    } catch (err) {
      setError('Error al cargar información de red');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveNetwork = async (newScope) => {
    try {
      setSaving(true);
      setError('');
      await auditsApi.updateAuditNetwork(auditId, { scope: newScope });
      setScope(newScope);
      setSuccess('Cambios guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar cambios');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle expansión
  const toggleScope = (index) => {
    setExpandedScopes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleHost = (scopeIdx, hostIdx) => {
    const key = `${scopeIdx}-${hostIdx}`;
    setExpandedHosts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ============================================
  // SCOPE CRUD
  // ============================================
  
  const openAddScope = () => {
    setScopeForm({ name: '' });
    setEditingScopeIndex(null);
    setShowScopeModal(true);
  };

  const openEditScope = (index) => {
    setScopeForm({ name: scope[index].name });
    setEditingScopeIndex(index);
    setShowScopeModal(true);
  };

  const handleSaveScope = () => {
    if (!scopeForm.name.trim()) return;
    
    const newScope = [...scope];
    if (editingScopeIndex !== null) {
      newScope[editingScopeIndex] = { ...newScope[editingScopeIndex], name: scopeForm.name };
    } else {
      newScope.push({ name: scopeForm.name, hosts: [] });
    }
    
    saveNetwork(newScope);
    setShowScopeModal(false);
  };

  const handleDeleteScope = (index) => {
    if (!confirm('¿Eliminar este scope y todos sus hosts?')) return;
    const newScope = scope.filter((_, i) => i !== index);
    saveNetwork(newScope);
  };

  // ============================================
  // HOST CRUD
  // ============================================

  const openAddHost = (scopeIndex) => {
    setHostForm({ hostname: '', ip: '', os: '' });
    setCurrentScopeIndex(scopeIndex);
    setEditingHostIndex(null);
    setShowHostModal(true);
  };

  const openEditHost = (scopeIndex, hostIndex) => {
    const host = scope[scopeIndex].hosts[hostIndex];
    setHostForm({ hostname: host.hostname || '', ip: host.ip || '', os: host.os || '' });
    setCurrentScopeIndex(scopeIndex);
    setEditingHostIndex(hostIndex);
    setShowHostModal(true);
  };

  const handleSaveHost = () => {
    if (!hostForm.hostname.trim() && !hostForm.ip.trim()) return;
    
    const newScope = [...scope];
    const hosts = [...newScope[currentScopeIndex].hosts];
    
    if (editingHostIndex !== null) {
      hosts[editingHostIndex] = { 
        ...hosts[editingHostIndex], 
        hostname: hostForm.hostname,
        ip: hostForm.ip,
        os: hostForm.os
      };
    } else {
      hosts.push({ 
        hostname: hostForm.hostname, 
        ip: hostForm.ip, 
        os: hostForm.os, 
        services: [] 
      });
    }
    
    newScope[currentScopeIndex] = { ...newScope[currentScopeIndex], hosts };
    saveNetwork(newScope);
    setShowHostModal(false);
  };

  const handleDeleteHost = (scopeIndex, hostIndex) => {
    if (!confirm('¿Eliminar este host y todos sus servicios?')) return;
    
    const newScope = [...scope];
    newScope[scopeIndex].hosts = newScope[scopeIndex].hosts.filter((_, i) => i !== hostIndex);
    saveNetwork(newScope);
  };

  // ============================================
  // SERVICE CRUD
  // ============================================

  const openAddService = (scopeIndex, hostIndex) => {
    setServiceForm({ port: '', protocol: 'tcp', name: '', product: '', version: '' });
    setCurrentScopeIndex(scopeIndex);
    setCurrentHostIndex(hostIndex);
    setEditingServiceIndex(null);
    setShowServiceModal(true);
  };

  const openEditService = (scopeIndex, hostIndex, serviceIndex) => {
    const service = scope[scopeIndex].hosts[hostIndex].services[serviceIndex];
    setServiceForm({
      port: service.port?.toString() || '',
      protocol: service.protocol || 'tcp',
      name: service.name || '',
      product: service.product || '',
      version: service.version || ''
    });
    setCurrentScopeIndex(scopeIndex);
    setCurrentHostIndex(hostIndex);
    setEditingServiceIndex(serviceIndex);
    setShowServiceModal(true);
  };

  const handleSaveService = () => {
    if (!serviceForm.port) return;
    
    const newScope = [...scope];
    const services = [...newScope[currentScopeIndex].hosts[currentHostIndex].services];
    
    const serviceData = {
      port: parseInt(serviceForm.port),
      protocol: serviceForm.protocol,
      name: serviceForm.name,
      product: serviceForm.product,
      version: serviceForm.version
    };
    
    if (editingServiceIndex !== null) {
      services[editingServiceIndex] = serviceData;
    } else {
      services.push(serviceData);
    }
    
    newScope[currentScopeIndex].hosts[currentHostIndex].services = services;
    saveNetwork(newScope);
    setShowServiceModal(false);
  };

  const handleDeleteService = (scopeIndex, hostIndex, serviceIndex) => {
    const newScope = [...scope];
    newScope[scopeIndex].hosts[hostIndex].services = 
      newScope[scopeIndex].hosts[hostIndex].services.filter((_, i) => i !== serviceIndex);
    saveNetwork(newScope);
  };

  // ============================================
  // BULK IMPORT - HOSTS
  // ============================================

  const openBulkHosts = (scopeIndex) => {
    setCurrentScopeIndex(scopeIndex);
    setBulkHostsText('');
    setBulkPreview([]);
    setShowBulkHostsModal(true);
  };

  const parseBulkHosts = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const hosts = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detectar formato: IP, hostname, o "IP hostname" o "hostname IP"
      const parts = trimmed.split(/[\s\t,;]+/);
      
      let ip = '';
      let hostname = '';
      
      for (const part of parts) {
        // Detectar si es IP (IPv4 simple)
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(part)) {
          ip = part;
        } else if (part && !hostname) {
          hostname = part;
        }
      }
      
      // Si solo hay un valor, determinar si es IP o hostname
      if (!ip && !hostname && parts[0]) {
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parts[0])) {
          ip = parts[0];
        } else {
          hostname = parts[0];
        }
      }
      
      if (ip || hostname) {
        hosts.push({ ip, hostname, os: '', services: [] });
      }
    }
    
    return hosts;
  };

  const handleBulkHostsPreview = () => {
    const parsed = parseBulkHosts(bulkHostsText);
    setBulkPreview(parsed);
  };

  const handleSaveBulkHosts = () => {
    if (bulkPreview.length === 0) return;
    
    const newScope = [...scope];
    const existingHosts = newScope[currentScopeIndex].hosts || [];
    
    // Agregar solo hosts que no existan (por IP o hostname)
    const existingIps = new Set(existingHosts.map(h => h.ip).filter(Boolean));
    const existingHostnames = new Set(existingHosts.map(h => h.hostname).filter(Boolean));
    
    const newHosts = bulkPreview.filter(h => {
      if (h.ip && existingIps.has(h.ip)) return false;
      if (h.hostname && existingHostnames.has(h.hostname)) return false;
      return true;
    });
    
    newScope[currentScopeIndex].hosts = [...existingHosts, ...newHosts];
    saveNetwork(newScope);
    setShowBulkHostsModal(false);
    setSuccess(`${newHosts.length} host(s) agregado(s)`);
  };

  // ============================================
  // BULK IMPORT - SERVICES (NMAP FORMAT)
  // ============================================

  const openBulkServices = (scopeIndex, hostIndex) => {
    setCurrentScopeIndex(scopeIndex);
    setCurrentHostIndex(hostIndex);
    setBulkServicesText('');
    setBulkPreview([]);
    setShowBulkServicesModal(true);
  };

  const parseBulkServices = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const services = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Formato nmap: "22/tcp open ssh OpenSSH 8.9p1"
      // Formato simple: "22 tcp ssh" o "22/tcp ssh" o "80 http nginx 1.18"
      // Formato con guiones: "443/tcp open ssl/http Apache httpd 2.4.41"
      
      let port = null;
      let protocol = 'tcp';
      let name = '';
      let product = '';
      let version = '';
      
      // Intentar formato nmap completo
      const nmapMatch = trimmed.match(/^(\d+)\/(tcp|udp)\s+\w+\s+(.*)$/i);
      if (nmapMatch) {
        port = parseInt(nmapMatch[1]);
        protocol = nmapMatch[2].toLowerCase();
        const rest = nmapMatch[3].trim();
        
        // Parsear el resto: "ssh OpenSSH 8.9p1" o "http Apache httpd 2.4.41"
        const restParts = rest.split(/\s+/);
        if (restParts[0]) {
          name = restParts[0].replace('ssl/', '');
        }
        if (restParts.length > 1) {
          // Buscar versión (algo que parece número/versión)
          const versionIdx = restParts.findIndex((p, i) => i > 0 && /[\d.]/.test(p));
          if (versionIdx > 1) {
            product = restParts.slice(1, versionIdx).join(' ');
            version = restParts.slice(versionIdx).join(' ');
          } else if (versionIdx === 1) {
            version = restParts.slice(1).join(' ');
          } else {
            product = restParts.slice(1).join(' ');
          }
        }
      } else {
        // Formato simple: "22/tcp ssh" o "22 tcp ssh" o "80 http"
        const simpleParts = trimmed.split(/[\s\/,;]+/);
        
        for (let i = 0; i < simpleParts.length; i++) {
          const part = simpleParts[i];
          
          if (!port && /^\d+$/.test(part)) {
            port = parseInt(part);
          } else if (part.toLowerCase() === 'tcp' || part.toLowerCase() === 'udp') {
            protocol = part.toLowerCase();
          } else if (part.toLowerCase() === 'open' || part.toLowerCase() === 'closed' || part.toLowerCase() === 'filtered') {
            // Ignorar estado nmap
            continue;
          } else if (!name && port) {
            name = part;
          } else if (!product && name) {
            product = part;
          } else if (!version && product && /[\d.]/.test(part)) {
            version = part;
          }
        }
      }
      
      if (port) {
        services.push({ port, protocol, name, product, version });
      }
    }
    
    return services;
  };

  const handleBulkServicesPreview = () => {
    const parsed = parseBulkServices(bulkServicesText);
    setBulkPreview(parsed);
  };

  const handleSaveBulkServices = () => {
    if (bulkPreview.length === 0) return;
    
    const newScope = [...scope];
    const existingServices = newScope[currentScopeIndex].hosts[currentHostIndex].services || [];
    
    // Agregar solo servicios que no existan (por puerto+protocolo)
    const existingPorts = new Set(existingServices.map(s => `${s.port}/${s.protocol}`));
    
    const newServices = bulkPreview.filter(s => !existingPorts.has(`${s.port}/${s.protocol}`));
    
    newScope[currentScopeIndex].hosts[currentHostIndex].services = [...existingServices, ...newServices];
    saveNetwork(newScope);
    setShowBulkServicesModal(false);
    setSuccess(`${newServices.length} servicio(s) agregado(s)`);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Card className="py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400">Cargando información de red...</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Alcance de Red</h3>
              <p className="text-sm text-gray-400">
                {scope.length} scope(s), {scope.reduce((acc, s) => acc + (s.hosts?.length || 0), 0)} host(s)
              </p>
            </div>
          </div>
          <Button variant="primary" icon={Plus} onClick={openAddScope}>
            Agregar Scope
          </Button>
        </div>
      </Card>

      {/* Empty State */}
      {scope.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Sin información de red</h3>
            <p className="text-gray-400 mb-4">
              Agrega scopes para definir el alcance de la auditoría
            </p>
            <Button variant="primary" icon={Plus} onClick={openAddScope}>
              Agregar Primer Scope
            </Button>
          </div>
        </Card>
      ) : (
        /* Scope List */
        <div className="space-y-3">
          {scope.map((scopeItem, scopeIdx) => (
            <Card key={scopeIdx} className="overflow-hidden">
              {/* Scope Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary"
                onClick={() => toggleScope(scopeIdx)}
              >
                <div className="flex items-center gap-3">
                  {expandedScopes[scopeIdx] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <Globe className="w-5 h-5 text-accent-400" />
                  <div>
                    <h4 className="text-white font-medium">{scopeItem.name}</h4>
                    <p className="text-sm text-gray-500">{scopeItem.hosts?.length || 0} host(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openBulkHosts(scopeIdx)}
                    className="p-2 text-gray-400 hover:text-accent-400 hover:bg-bg-secondary rounded"
                    title="Importar hosts en lote"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openAddHost(scopeIdx)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-bg-secondary rounded"
                    title="Agregar host"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditScope(scopeIdx)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-bg-secondary rounded"
                    title="Editar scope"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteScope(scopeIdx)}
                    className="p-2 text-gray-400 hover:text-danger-400 hover:bg-bg-secondary rounded"
                    title="Eliminar scope"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hosts */}
              {expandedScopes[scopeIdx] && (
                <div className="border-t border-gray-800">
                  {scopeItem.hosts?.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No hay hosts en este scope
                    </div>
                  ) : (
                    scopeItem.hosts?.map((host, hostIdx) => {
                      const hostKey = `${scopeIdx}-${hostIdx}`;
                      return (
                        <div key={hostIdx} className="border-b border-gray-800 last:border-b-0">
                          {/* Host Header */}
                          <div 
                            className="flex items-center justify-between p-4 pl-12 cursor-pointer hover:bg-bg-tertiary"
                            onClick={() => toggleHost(scopeIdx, hostIdx)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedHosts[hostKey] ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <Server className="w-4 h-4 text-info-400" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white">{host.hostname || host.ip}</span>
                                  {host.hostname && host.ip && (
                                    <span className="text-gray-500 text-sm">({host.ip})</span>
                                  )}
                                </div>
                                {host.os && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Monitor className="w-3 h-3" /> {host.os}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <span className="text-xs text-gray-500 mr-2">
                                {host.services?.length || 0} servicio(s)
                              </span>
                              <button
                                onClick={() => openBulkServices(scopeIdx, hostIdx)}
                                className="p-1.5 text-gray-400 hover:text-accent-400 hover:bg-bg-secondary rounded"
                                title="Importar servicios (nmap)"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openAddService(scopeIdx, hostIdx)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-secondary rounded"
                                title="Agregar servicio"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditHost(scopeIdx, hostIdx)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-bg-secondary rounded"
                                title="Editar host"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteHost(scopeIdx, hostIdx)}
                                className="p-1.5 text-gray-400 hover:text-danger-400 hover:bg-bg-secondary rounded"
                                title="Eliminar host"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Services */}
                          {expandedHosts[hostKey] && host.services?.length > 0 && (
                            <div className="bg-bg-tertiary">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 text-xs">
                                    <th className="text-left py-2 pl-20 pr-4">Puerto</th>
                                    <th className="text-left py-2 px-4">Protocolo</th>
                                    <th className="text-left py-2 px-4">Servicio</th>
                                    <th className="text-left py-2 px-4">Producto</th>
                                    <th className="text-left py-2 px-4">Versión</th>
                                    <th className="text-right py-2 px-4">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {host.services.map((service, svcIdx) => (
                                    <tr key={svcIdx} className="border-t border-gray-700 text-gray-300">
                                      <td className="py-2 pl-20 pr-4 font-mono">{service.port}</td>
                                      <td className="py-2 px-4 uppercase text-xs">{service.protocol}</td>
                                      <td className="py-2 px-4">{service.name || '-'}</td>
                                      <td className="py-2 px-4">{service.product || '-'}</td>
                                      <td className="py-2 px-4">{service.version || '-'}</td>
                                      <td className="py-2 px-4 text-right">
                                        <button
                                          onClick={() => openEditService(scopeIdx, hostIdx, svcIdx)}
                                          className="p-1 text-gray-400 hover:text-white"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteService(scopeIdx, hostIdx, svcIdx)}
                                          className="p-1 text-gray-400 hover:text-danger-400 ml-1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Scope Modal */}
      <Modal
        isOpen={showScopeModal}
        onClose={() => setShowScopeModal(false)}
        title={editingScopeIndex !== null ? 'Editar Scope' : 'Agregar Scope'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre del Scope
            </label>
            <input
              type="text"
              value={scopeForm.name}
              onChange={(e) => setScopeForm({ name: e.target.value })}
              placeholder="Ej: Red Interna, DMZ, Cloud AWS"
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowScopeModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveScope} isLoading={saving}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Host Modal */}
      <Modal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        title={editingHostIndex !== null ? 'Editar Host' : 'Agregar Host'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Hostname
              </label>
              <input
                type="text"
                value={hostForm.hostname}
                onChange={(e) => setHostForm({ ...hostForm, hostname: e.target.value })}
                placeholder="server1.example.com"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                IP
              </label>
              <input
                type="text"
                value={hostForm.ip}
                onChange={(e) => setHostForm({ ...hostForm, ip: e.target.value })}
                placeholder="192.168.1.10"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Sistema Operativo
            </label>
            <input
              type="text"
              value={hostForm.os}
              onChange={(e) => setHostForm({ ...hostForm, os: e.target.value })}
              placeholder="Ubuntu 22.04 LTS"
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowHostModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveHost} isLoading={saving}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Service Modal */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title={editingServiceIndex !== null ? 'Editar Servicio' : 'Agregar Servicio'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Puerto <span className="text-danger-400">*</span>
              </label>
              <input
                type="number"
                value={serviceForm.port}
                onChange={(e) => setServiceForm({ ...serviceForm, port: e.target.value })}
                placeholder="80"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Protocolo
              </label>
              <select
                value={serviceForm.protocol}
                onChange={(e) => setServiceForm({ ...serviceForm, protocol: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre del Servicio
            </label>
            <input
              type="text"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              placeholder="http, ssh, mysql..."
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Producto
              </label>
              <input
                type="text"
                value={serviceForm.product}
                onChange={(e) => setServiceForm({ ...serviceForm, product: e.target.value })}
                placeholder="nginx, OpenSSH..."
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Versión
              </label>
              <input
                type="text"
                value={serviceForm.version}
                onChange={(e) => setServiceForm({ ...serviceForm, version: e.target.value })}
                placeholder="1.18.0"
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowServiceModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveService} isLoading={saving}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Hosts Modal */}
      <Modal
        isOpen={showBulkHostsModal}
        onClose={() => setShowBulkHostsModal(false)}
        title="Importar Hosts en Lote"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Lista de Hosts
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pega una lista de IPs o hostnames, uno por línea. Formatos soportados:
            </p>
            <div className="text-xs text-gray-500 bg-bg-tertiary p-2 rounded mb-3 font-mono">
              192.168.1.1<br/>
              192.168.1.2 servidor-web<br/>
              db.example.com 10.0.0.5<br/>
              mail.example.com
            </div>
            <textarea
              value={bulkHostsText}
              onChange={(e) => setBulkHostsText(e.target.value)}
              placeholder="Pega aquí tu lista de hosts..."
              rows={8}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkHostsPreview}>
              Vista Previa
            </Button>
            {bulkPreview.length > 0 && (
              <span className="text-sm text-gray-400 self-center">
                {bulkPreview.length} host(s) detectado(s)
              </span>
            )}
          </div>

          {bulkPreview.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary sticky top-0">
                  <tr className="text-gray-400 text-xs">
                    <th className="text-left py-2 px-4">IP</th>
                    <th className="text-left py-2 px-4">Hostname</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.map((host, idx) => (
                    <tr key={idx} className="border-t border-gray-800 text-gray-300">
                      <td className="py-2 px-4 font-mono">{host.ip || '-'}</td>
                      <td className="py-2 px-4">{host.hostname || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowBulkHostsModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              icon={Upload} 
              onClick={handleSaveBulkHosts} 
              isLoading={saving}
              disabled={bulkPreview.length === 0}
            >
              Importar {bulkPreview.length > 0 && `(${bulkPreview.length})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Services Modal (Nmap) */}
      <Modal
        isOpen={showBulkServicesModal}
        onClose={() => setShowBulkServicesModal(false)}
        title="Importar Servicios (Nmap)"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Salida de Nmap o Lista de Servicios
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pega la salida de nmap o una lista de puertos. Formatos soportados:
            </p>
            <div className="text-xs text-gray-500 bg-bg-tertiary p-2 rounded mb-3 font-mono">
              22/tcp open ssh OpenSSH 8.9p1<br/>
              80/tcp open http nginx 1.18.0<br/>
              443/tcp open ssl/http Apache httpd 2.4.41<br/>
              3306/tcp open mysql MySQL 8.0.32
            </div>
            <textarea
              value={bulkServicesText}
              onChange={(e) => setBulkServicesText(e.target.value)}
              placeholder="Pega aquí la salida de nmap..."
              rows={10}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkServicesPreview}>
              Vista Previa
            </Button>
            {bulkPreview.length > 0 && (
              <span className="text-sm text-gray-400 self-center">
                {bulkPreview.length} servicio(s) detectado(s)
              </span>
            )}
          </div>

          {bulkPreview.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary sticky top-0">
                  <tr className="text-gray-400 text-xs">
                    <th className="text-left py-2 px-4">Puerto</th>
                    <th className="text-left py-2 px-4">Proto</th>
                    <th className="text-left py-2 px-4">Servicio</th>
                    <th className="text-left py-2 px-4">Producto</th>
                    <th className="text-left py-2 px-4">Versión</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.map((svc, idx) => (
                    <tr key={idx} className="border-t border-gray-800 text-gray-300">
                      <td className="py-2 px-4 font-mono">{svc.port}</td>
                      <td className="py-2 px-4 uppercase text-xs">{svc.protocol}</td>
                      <td className="py-2 px-4">{svc.name || '-'}</td>
                      <td className="py-2 px-4">{svc.product || '-'}</td>
                      <td className="py-2 px-4">{svc.version || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowBulkServicesModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              icon={Upload} 
              onClick={handleSaveBulkServices} 
              isLoading={saving}
              disabled={bulkPreview.length === 0}
            >
              Importar {bulkPreview.length > 0 && `(${bulkPreview.length})`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NetworkTab;