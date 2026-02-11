import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Modal Component
 * 
 * Modal reutilizable con soporte para diferentes tamaños,
 * cierre con tecla Escape y click fuera del modal.
 * 
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cerrar el modal
 * @param {string} title - Título del modal (opcional)
 * @param {React.ReactNode} children - Contenido del modal
 * @param {string} size - Tamaño del modal: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} showCloseButton - Mostrar botón X para cerrar
 * @param {boolean} closeOnOverlayClick - Cerrar al hacer click en el overlay
 * @param {boolean} closeOnEscape - Cerrar al presionar Escape
 * @param {string} className - Clases adicionales para el contenido
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef(null);

  // Manejar tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap básico
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Tamaños del modal
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full bg-bg-secondary border border-gray-800 rounded-xl shadow-2xl',
          'transform transition-all duration-200',
          'animate-in fade-in zoom-in-95',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors ml-auto"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  // Usar portal para renderizar fuera del árbol DOM normal
  return createPortal(modalContent, document.body);
};

/**
 * ConfirmModal - Modal de confirmación predefinido
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger', 'warning', 'primary'
  isLoading = false,
}) => {
  const variantStyles = {
    danger: 'bg-danger-500 hover:bg-danger-600',
    warning: 'bg-warning-500 hover:bg-warning-600',
    primary: 'bg-primary-500 hover:bg-primary-600',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {message && <p className="text-gray-300">{message}</p>}
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              variantStyles[variant]
            )}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;