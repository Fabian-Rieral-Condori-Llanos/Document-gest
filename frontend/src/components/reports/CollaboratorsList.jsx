import { useSelector } from 'react-redux';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { selectActiveCollaborators, selectIsConnected } from '../../features/reportInstances';

/**
 * CollaboratorsList
 * 
 * Muestra la lista de colaboradores activos en la sesión de edición.
 */
const CollaboratorsList = ({ compact = false }) => {
  const collaborators = useSelector(selectActiveCollaborators);
  const isConnected = useSelector(selectIsConnected);

  // Vista compacta (solo avatares)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Indicador de conexión */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isConnected
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {isConnected ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>

        {/* Avatares */}
        {collaborators.length > 0 && (
          <div className="flex items-center -space-x-2">
            {collaborators.slice(0, 5).map((c) => (
              <div
                key={c.userId}
                className="w-8 h-8 rounded-full border-2 border-bg-secondary flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: c.color || '#6b7280' }}
                title={c.username}
              >
                {c.username?.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborators.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-bg-secondary bg-bg-tertiary flex items-center justify-center text-xs font-medium text-gray-400">
                +{collaborators.length - 5}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa (lista)
  return (
    <div className="bg-bg-secondary border border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-white">
          Colaboradores ({collaborators.length})
        </span>
        <div
          className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isConnected
              ? 'bg-green-500/10 text-green-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              Conectado
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Desconectado
            </>
          )}
        </div>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          No hay otros colaboradores
        </p>
      ) : (
        <div className="space-y-2">
          {collaborators.map((c) => (
            <div
              key={c.userId}
              className="flex items-center gap-3 px-3 py-2 bg-bg-tertiary rounded-lg"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ backgroundColor: c.color || '#6b7280' }}
              >
                {c.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.username}</p>
                {c.cursor !== null && (
                  <p className="text-xs text-gray-500">Editando...</p>
                )}
              </div>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c.color || '#6b7280' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaboratorsList;
