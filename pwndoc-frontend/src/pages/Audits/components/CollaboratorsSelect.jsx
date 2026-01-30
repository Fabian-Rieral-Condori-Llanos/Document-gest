import { useState, memo } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

/**
 * CollaboratorsSelect - Selector múltiple de colaboradores
 * 
 * @param {Array} users - Lista de usuarios disponibles
 * @param {Array} selectedIds - IDs de usuarios seleccionados
 * @param {Function} onChange - Callback al cambiar selección
 * @param {string} label - Etiqueta del campo
 * @param {string} placeholder - Placeholder del botón
 * @param {Array} excludeUserIds - IDs de usuarios a excluir
 * @param {Array} excludeRoles - Roles a excluir (ej: ['analyst'])
 * @param {number} maxVisible - Máximo de usuarios visibles antes de mostrar "+X más"
 */
const CollaboratorsSelect = ({
  users = [],
  selectedIds = [],
  onChange,
  label = 'Colaboradores',
  placeholder = 'Agregar colaboradores...',
  excludeUserIds = [],
  excludeRoles = [],
  maxVisible = 5,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar usuarios disponibles
  // - Excluir por IDs específicos
  // - Excluir por roles específicos
  // - Aplicar búsqueda
  const availableUsers = users.filter(user => {
    // Excluir por ID
    if (excludeUserIds.includes(user._id)) {
      return false;
    }
    
    // Excluir por rol
    if (excludeRoles.length > 0 && excludeRoles.includes(user.role)) {
      return false;
    }
    
    // Aplicar búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchUsername = user.username?.toLowerCase().includes(search);
      const matchFirstname = user.firstname?.toLowerCase().includes(search);
      const matchLastname = user.lastname?.toLowerCase().includes(search);
      const matchEmail = user.email?.toLowerCase().includes(search);
      
      if (!matchUsername && !matchFirstname && !matchLastname && !matchEmail) {
        return false;
      }
    }
    
    return true;
  });

  // Obtener usuarios seleccionados
  const selectedUsers = users.filter(user => selectedIds.includes(user._id));

  const handleToggleUser = (userId) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const handleRemoveUser = (userId) => {
    onChange(selectedIds.filter(id => id !== userId));
  };

  const getUserDisplayName = (user) => {
    if (user.firstname || user.lastname) {
      return `${user.firstname || ''} ${user.lastname || ''}`.trim();
    }
    return user.username;
  };

  const getUserInitials = (user) => {
    if (user.firstname && user.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || '??';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400';
      case 'user':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Selected Users */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUsers.slice(0, maxVisible).map(user => (
          <div
            key={user._id}
            className="flex items-center gap-2 px-2 py-1 bg-bg-tertiary border border-gray-700 rounded-lg"
          >
            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-400">
                {getUserInitials(user)}
              </span>
            </div>
            <span className="text-sm text-gray-300">
              {getUserDisplayName(user)}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveUser(user._id)}
              className="text-gray-500 hover:text-danger-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {selectedUsers.length > maxVisible && (
          <div className="flex items-center px-2 py-1 bg-bg-tertiary border border-gray-700 rounded-lg">
            <span className="text-sm text-gray-400">
              +{selectedUsers.length - maxVisible} más
            </span>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors w-full"
      >
        <UserPlus className="w-4 h-4" />
        <span className="text-sm">{placeholder}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 right-0 top-full mt-1 bg-bg-tertiary border border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-700">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
                autoFocus
              />
            </div>

            {/* Users List */}
            <div className="overflow-y-auto max-h-48">
              {availableUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron usuarios
                </div>
              ) : (
                availableUsers.map(user => {
                  const isSelected = selectedIds.includes(user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => handleToggleUser(user._id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-secondary transition-colors ${
                        isSelected ? 'bg-primary-500/10' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-400">
                          {getUserInitials(user)}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {getUserDisplayName(user)}
                          </p>
                          {user.role && (
                            <span className={`px-1.5 py-0.5 text-xs rounded capitalize ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email || user.username}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(CollaboratorsSelect);