import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import {
  setActiveCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorCursor,
  setConnectionStatus,
  updateCurrentInstanceContent,
} from '../features/reportInstances/reportInstancesSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5252';

/**
 * Hook para colaboración en tiempo real en el editor de reportes
 * 
 * @param {string} reportInstanceId - ID de la instancia del reporte
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Métodos y estado de la colaboración
 */
export const useReportCollaboration = (reportInstanceId, options = {}) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const { onContentChange, autoConnect = true } = options;

  /**
   * Conectar al servidor de colaboración
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected || !reportInstanceId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[Collab] No token available');
      dispatch(setConnectionStatus({ connected: false, error: 'No autenticado' }));
      return;
    }

    // Crear socket con namespace de reportes
    const socket = io(`${SOCKET_URL}/reports`, {
      auth: { token: `JWT ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Crear documento Y.js
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Event handlers
    socket.on('connect', () => {
      console.log('[Collab] Connected to server');
      dispatch(setConnectionStatus({ connected: true }));
      
      // Unirse a la sesión del reporte
      socket.emit('report:join', { reportInstanceId });
    });

    socket.on('connect_error', (error) => {
      console.error('[Collab] Connection error:', error.message);
      dispatch(setConnectionStatus({ connected: false, error: error.message }));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Collab] Disconnected:', reason);
      dispatch(setConnectionStatus({ connected: false }));
      setIsReady(false);
    });

    // Sincronización inicial
    socket.on('report:sync', ({ state, collaborators }) => {
      console.log('[Collab] Received initial sync');
      
      if (state) {
        try {
          const stateArray = new Uint8Array(state);
          Y.applyUpdate(ydoc, stateArray);
        } catch (err) {
          console.error('[Collab] Error applying initial state:', err);
        }
      }
      
      dispatch(setActiveCollaborators(collaborators || []));
      setIsReady(true);
    });

    // Actualizaciones de otros usuarios
    socket.on('report:update', ({ update, origin }) => {
      try {
        const updateArray = new Uint8Array(update);
        Y.applyUpdate(ydoc, updateArray, 'remote');
      } catch (err) {
        console.error('[Collab] Error applying remote update:', err);
      }
    });

    // Usuario se unió
    socket.on('report:user-joined', ({ userId, username, collaborators }) => {
      console.log('[Collab] User joined:', username);
      dispatch(setActiveCollaborators(collaborators));
    });

    // Usuario salió
    socket.on('report:user-left', ({ userId, username, collaborators }) => {
      console.log('[Collab] User left:', username);
      dispatch(setActiveCollaborators(collaborators));
    });

    // Cursor de otro usuario
    socket.on('report:cursor', ({ userId, username, cursor, selection, color }) => {
      dispatch(updateCollaboratorCursor({ userId, cursor, selection, color }));
    });

    // Confirmación de guardado
    socket.on('report:saved', ({ success, timestamp }) => {
      if (success) {
        setLastSaved(new Date(timestamp));
      }
    });

    // Errores
    socket.on('report:error', ({ message }) => {
      console.error('[Collab] Error:', message);
    });

    // Observar cambios locales en Y.js
    ydoc.on('update', (update, origin) => {
      if (origin !== 'remote' && socket.connected) {
        // Enviar actualización a otros
        socket.emit('report:update', {
          reportInstanceId,
          update: Array.from(update)
        });
      }

      // Notificar cambio de contenido
      if (onContentChange) {
        const content = ydoc.getMap('content').get('root');
        onContentChange(content?.toJSON?.() || content);
      }
    });

    return socket;
  }, [reportInstanceId, dispatch, onContentChange]);

  /**
   * Desconectar del servidor
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('report:leave');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    
    setIsReady(false);
    dispatch(setConnectionStatus({ connected: false }));
    dispatch(setActiveCollaborators([]));
  }, [dispatch]);

  /**
   * Enviar posición del cursor
   */
  const sendCursor = useCallback((cursor, selection) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('report:cursor', { cursor, selection });
    }
  }, []);

  /**
   * Guardar manualmente
   */
  const save = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('report:save');
    }
  }, []);

  /**
   * Solicitar resincronización
   */
  const resync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('report:resync');
    }
  }, []);

  /**
   * Obtener el documento Y.js
   */
  const getYDoc = useCallback(() => ydocRef.current, []);

  /**
   * Obtener el contenido actual
   */
  const getContent = useCallback(() => {
    const ydoc = ydocRef.current;
    if (!ydoc) return null;
    
    const content = ydoc.getMap('content').get('root');
    return content?.toJSON?.() || content;
  }, []);

  /**
   * Actualizar contenido local
   */
  const setContent = useCallback((content) => {
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    ydoc.transact(() => {
      const yContent = ydoc.getMap('content');
      setYValue(yContent, 'root', content);
    });
  }, []);

  // Auto-conectar al montar
  useEffect(() => {
    if (autoConnect && reportInstanceId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [reportInstanceId, autoConnect, connect, disconnect]);

  return {
    // Estado
    isReady,
    isConnected: socketRef.current?.connected || false,
    lastSaved,
    
    // Métodos
    connect,
    disconnect,
    sendCursor,
    save,
    resync,
    getYDoc,
    getContent,
    setContent,
  };
};

/**
 * Helper para establecer valores en Y.js recursivamente
 */
function setYValue(ymap, key, value) {
  if (value === null || value === undefined) {
    ymap.set(key, null);
  } else if (Array.isArray(value)) {
    const yarray = new Y.Array();
    value.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        const nestedMap = new Y.Map();
        Object.entries(item).forEach(([k, v]) => {
          setYValue(nestedMap, k, v);
        });
        yarray.push([nestedMap]);
      } else {
        yarray.push([item]);
      }
    });
    ymap.set(key, yarray);
  } else if (typeof value === 'object') {
    const nestedMap = new Y.Map();
    Object.entries(value).forEach(([k, v]) => {
      setYValue(nestedMap, k, v);
    });
    ymap.set(key, nestedMap);
  } else {
    ymap.set(key, value);
  }
}

export default useReportCollaboration;
