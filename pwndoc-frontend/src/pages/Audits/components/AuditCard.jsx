import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Building2, 
  Globe, 
  AlertTriangle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import AuditStateBadge from './AuditStateBadge';
import AuditTypeBadge from './AuditTypeBadge';

/**
 * AuditCard - Card para mostrar una auditoría en la lista
 */
const AuditCard = ({
  audit,
  onDelete,
  onDuplicate,
  onCreateRetest,
  className = '',
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const {
    _id,
    name,
    auditType,
    state,
    type,
    language,
    company,
    //client,
    collaborators = [],
    findings = [],
    createdAt,
    creator,
  } = audit;

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Obtener nombre de empresa
  const companyName = typeof company === 'object' ? company?.name : company;
  
  // Obtener nombre de cliente
  // const clientName = typeof client === 'object' ? client?.name : client;
  // console.log("clientName", client)

  // Obtener nombre del creador
  const creatorName = typeof creator === 'object' 
    ? `${creator?.firstname || ''} ${creator?.lastname || ''}`.trim() || creator?.username 
    : creator;

  // Contar findings por severidad
  const findingsCount = findings.length;

  const handleView = () => {
    navigate(`/audits/${_id}`);
  };

  const handleEdit = () => {
    navigate(`/audits/${_id}/edit`);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'view':
        handleView();
        break;
      case 'edit':
        handleEdit();
        break;
      case 'delete':
        onDelete?.(_id);
        break;
      case 'duplicate':
        onDuplicate?.(_id);
        break;
      case 'retest':
        onCreateRetest?.(_id);
        break;
    }
  };

  return (
    <div 
      className={`
        bg-bg-secondary border border-gray-800 rounded-xl p-5 
        hover:border-gray-700 transition-all duration-200 
        group relative
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 
            className="text-lg font-semibold text-white truncate cursor-pointer hover:text-primary-400 transition-colors"
            onClick={handleView}
            title={name}
          >
            {name}
          </h3>
          {auditType && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">
              {auditType}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AuditTypeBadge type={type} size="sm" />
          <AuditStateBadge state={state} size="sm" />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Empresa */}
        {companyName && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-300 truncate" title={companyName}>
              {companyName}
            </span>
          </div>
        )}

        {/* Idioma */}
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-300 uppercase">
            {language || '-'}
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-300">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Colaboradores */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-300">
            {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Findings Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning-400" />
          <span className="text-sm text-gray-300">
            <span className="font-semibold text-white">{findingsCount}</span> hallazgo{findingsCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Creator */}
        {creatorName && (
          <span className="text-xs text-gray-500">
            por {creatorName}
          </span>
        )}
      </div>

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 text-gray-500 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 py-1">
              <button
                onClick={() => handleMenuAction('view')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-bg-secondary hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver detalles
              </button>
              <button
                onClick={() => handleMenuAction('edit')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-bg-secondary hover:text-white transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <div className="border-t border-gray-700 my-1" />
              <button
                onClick={() => handleMenuAction('delete')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-400 hover:bg-danger-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(AuditCard);