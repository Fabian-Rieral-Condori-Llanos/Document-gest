import { useSelector } from 'react-redux';
import { Users } from 'lucide-react';
import { selectActiveCollaborators, selectIsConnected } from '../../features/reportInstances';

/**
 * Componente para mostrar la lista de colaboradores activos
 */
export default function CollaboratorsList({ compact = false }) {
  const collaborators = useSelector(selectActiveCollaborators);
  const isConnected = useSelector(selectIsConnected);

  if (collaborators.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'px-3 py-2'}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-500">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center -space-x-2">
        {collaborators.slice(0, 5).map((c) => (
          <div
            key={c.userId}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: c.color || '#6b7280' }}
            title={c.username}
          >
            {c.username?.charAt(0).toUpperCase()}
          </div>
        ))}
        {collaborators.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            +{collaborators.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Colaboradores ({collaborators.length})
        </span>
        <div className={`w-2 h-2 rounded-full ml-auto ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      <div className="space-y-2">
        {collaborators.map((c) => (
          <div key={c.userId} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: c.color || '#6b7280' }}
            >
              {c.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
              {c.username}
            </span>
            {c.cursor !== null && (
              <span className="text-xs text-gray-400">Editando...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
