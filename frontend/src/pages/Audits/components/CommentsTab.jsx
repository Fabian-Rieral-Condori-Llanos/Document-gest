import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Reply,
  CheckCircle,
  Circle,
  Send,
  CornerDownRight,
} from 'lucide-react';

// API
import * as auditsApi from '../../../api/endpoints/audits.api';

// Redux
import { selectCurrentUser } from '../../../features/auth/authSelectors';

// Components
import Card from '../../../components/common/Card/Card';
import Button from '../../../components/common/Button/Button';
import Alert from '../../../components/common/Alert/Alert';
import Modal from '../../../components/common/Modal/Modal';

// Utils
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getAuthorName = (author) => {
  if (!author) return 'Usuario desconocido';
  if (author.firstname || author.lastname) {
    return `${author.firstname || ''} ${author.lastname || ''}`.trim();
  }
  return author.username || 'Usuario';
};

const getInitials = (author) => {
  if (!author) return '?';
  if (author.firstname && author.lastname) {
    return `${author.firstname[0]}${author.lastname[0]}`.toUpperCase();
  }
  if (author.username) {
    return author.username.substring(0, 2).toUpperCase();
  }
  return '?';
};

/**
 * CommentsTab - Sistema de comentarios y revisiones
 */
const CommentsTab = ({ auditId, comments: initialComments = [], findings = [], sections = [], onRefresh }) => {
  // State
  const currentUser = useSelector(selectCurrentUser);
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter State
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  
  // Form State
  const [commentForm, setCommentForm] = useState({
    text: '',
    findingId: '',
    sectionId: '',
    fieldName: '',
  });
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Sync comments when prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Filtered comments
  const filteredComments = comments.filter(comment => {
    if (filter === 'pending') return !comment.resolved;
    if (filter === 'resolved') return comment.resolved;
    return true;
  });

  // Stats
  const stats = {
    total: comments.length,
    pending: comments.filter(c => !c.resolved).length,
    resolved: comments.filter(c => c.resolved).length,
  };

  // ============================================
  // CRUD
  // ============================================

  const openAddModal = () => {
    setCommentForm({ text: '', findingId: '', sectionId: '', fieldName: '' });
    setShowAddModal(true);
  };

  const openEditModal = (comment) => {
    setCommentForm({
      text: comment.text || '',
      findingId: comment.findingId || '',
      sectionId: comment.sectionId || '',
      fieldName: comment.fieldName || '',
    });
    setEditingComment(comment);
    setShowEditModal(true);
  };

  const openDeleteModal = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteModal(true);
  };

  const handleCreateComment = async () => {
    if (!commentForm.text.trim()) {
      setError('El comentario no puede estar vacío');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await auditsApi.createAuditComment(auditId, {
        text: commentForm.text,
        findingId: commentForm.findingId || null,
        sectionId: commentForm.sectionId || null,
        fieldName: commentForm.fieldName || '',
      });
      
      if (onRefresh) await onRefresh();
      setShowAddModal(false);
      setSuccess('Comentario agregado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!commentForm.text.trim()) {
      setError('El comentario no puede estar vacío');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await auditsApi.updateAuditComment(auditId, editingComment._id, {
        text: commentForm.text,
      });
      
      if (onRefresh) await onRefresh();
      setShowEditModal(false);
      setEditingComment(null);
      setSuccess('Comentario actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      setSaving(true);
      setError('');
      await auditsApi.deleteAuditComment(auditId, commentToDelete._id);
      
      if (onRefresh) await onRefresh();
      setShowDeleteModal(false);
      setCommentToDelete(null);
      setSuccess('Comentario eliminado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleResolved = async (comment) => {
    try {
      setSaving(true);
      await auditsApi.updateAuditComment(auditId, comment._id, {
        resolved: !comment.resolved,
      });
      
      if (onRefresh) await onRefresh();
    } catch (err) {
      setError('Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // REPLIES
  // ============================================

  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      setSaving(true);
      setError('');
      
      // Obtener comentario actual
      const comment = comments.find(c => c._id === commentId);
      const currentReplies = comment?.replies || [];
      
      await auditsApi.updateAuditComment(auditId, commentId, {
        replies: [...currentReplies, { text: replyText, author: currentUser?._id }],
      });
      
      if (onRefresh) await onRefresh();
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      setError('Error al agregar respuesta');
    } finally {
      setSaving(false);
    }
  };

  // Helper para obtener contexto del comentario
  const getCommentContext = (comment) => {
    if (comment.findingId) {
      const finding = findings.find(f => f._id === comment.findingId || f.id === comment.findingId);
      return finding ? `Hallazgo: ${finding.title}` : 'Hallazgo';
    }
    if (comment.sectionId || comment.fieldName) {
      const section = sections.find(s => s._id === comment.sectionId || s.field === comment.fieldName);
      return section ? `Sección: ${section.name}` : 'Sección';
    }
    return 'General';
  };

  // ============================================
  // RENDER
  // ============================================

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
            <MessageSquare className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Comentarios</h3>
              <p className="text-sm text-gray-400">
                {stats.total} comentario(s) • {stats.pending} pendiente(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex bg-bg-tertiary rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'pending' 
                    ? 'bg-warning-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pendientes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filter === 'resolved' 
                    ? 'bg-success-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Resueltos ({stats.resolved})
              </button>
            </div>
            
            <Button variant="primary" icon={Plus} onClick={openAddModal}>
              Nuevo Comentario
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredComments.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === 'all' ? 'Sin comentarios' : `Sin comentarios ${filter === 'pending' ? 'pendientes' : 'resueltos'}`}
            </h3>
            <p className="text-gray-400 mb-4">
              {filter === 'all' 
                ? 'Agrega comentarios para colaborar con el equipo de revisión'
                : 'No hay comentarios en este estado'
              }
            </p>
            {filter === 'all' && (
              <Button variant="primary" icon={Plus} onClick={openAddModal}>
                Agregar Comentario
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Comments List */
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              currentUser={currentUser}
              context={getCommentContext(comment)}
              onEdit={() => openEditModal(comment)}
              onDelete={() => openDeleteModal(comment)}
              onToggleResolved={() => handleToggleResolved(comment)}
              onReply={() => setReplyingTo(comment._id)}
              isReplying={replyingTo === comment._id}
              replyText={replyText}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => handleAddReply(comment._id)}
              onCancelReply={() => { setReplyingTo(null); setReplyText(''); }}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Add Comment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nuevo Comentario"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contexto (opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={commentForm.findingId}
                onChange={(e) => setCommentForm({ ...commentForm, findingId: e.target.value, sectionId: '' })}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Hallazgo --</option>
                {findings.map(f => (
                  <option key={f._id || f.id} value={f._id || f.id}>
                    #{f.identifier} - {f.title?.substring(0, 40)}...
                  </option>
                ))}
              </select>
              <select
                value={commentForm.fieldName}
                onChange={(e) => setCommentForm({ ...commentForm, fieldName: e.target.value, findingId: '' })}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Sección --</option>
                {sections.map(s => (
                  <option key={s._id || s.field} value={s.field}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Asocia el comentario a un hallazgo o sección específica</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Comentario <span className="text-danger-400">*</span>
            </label>
            <textarea
              value={commentForm.text}
              onChange={(e) => setCommentForm({ ...commentForm, text: e.target.value })}
              placeholder="Escribe tu comentario o nota de revisión..."
              rows={5}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Send} onClick={handleCreateComment} isLoading={saving}>
              Publicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Comment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingComment(null); }}
        title="Editar Comentario"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Comentario <span className="text-danger-400">*</span>
            </label>
            <textarea
              value={commentForm.text}
              onChange={(e) => setCommentForm({ ...commentForm, text: e.target.value })}
              placeholder="Escribe tu comentario..."
              rows={5}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditingComment(null); }}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleUpdateComment} isLoading={saving}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCommentToDelete(null); }}
        title="Eliminar Comentario"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            ¿Estás seguro de que deseas eliminar este comentario?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción eliminará también todas las respuestas.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setCommentToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteComment} isLoading={saving}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/**
 * CommentCard - Tarjeta individual de comentario
 */
const CommentCard = ({
  comment,
  currentUser,
  context,
  onEdit,
  onDelete,
  onToggleResolved,
  onReply,
  isReplying,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  saving,
}) => {
  const isAuthor = currentUser?._id === comment.author?._id;
  
  return (
    <Card className={`overflow-hidden ${comment.resolved ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-medium flex-shrink-0">
            {getInitials(comment.author)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">
                {getAuthorName(comment.author)}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
              {comment.resolved && (
                <span className="px-2 py-0.5 bg-success-500/10 text-success-400 text-xs rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Resuelto
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{context}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleResolved}
            className={`p-2 rounded transition-colors ${
              comment.resolved 
                ? 'text-success-400 hover:bg-success-500/10' 
                : 'text-gray-400 hover:text-success-400 hover:bg-bg-tertiary'
            }`}
            title={comment.resolved ? 'Marcar como pendiente' : 'Marcar como resuelto'}
          >
            {comment.resolved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          {isAuthor && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-danger-400 hover:bg-bg-tertiary rounded"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-gray-300 whitespace-pre-wrap">{comment.text}</p>
      </div>
      
      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="border-t border-gray-800 bg-bg-tertiary/50">
          {comment.replies.map((reply, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 border-b border-gray-800 last:border-b-0">
              <CornerDownRight className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 text-xs font-medium flex-shrink-0">
                {getInitials(reply.author)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">
                    {getAuthorName(reply.author)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{reply.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Reply Input */}
      {isReplying ? (
        <div className="border-t border-gray-800 p-4 bg-bg-tertiary/30">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-medium flex-shrink-0">
              {getInitials(currentUser)}
            </div>
            <div className="flex-1">
              <textarea
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                placeholder="Escribe una respuesta..."
                rows={2}
                className="w-full px-3 py-2 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={onCancelReply}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={Send} 
                  onClick={onSubmitReply}
                  isLoading={saving}
                  disabled={!replyText.trim()}
                >
                  Responder
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-800 px-4 py-2">
          <button
            onClick={onReply}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
          >
            <Reply className="w-4 h-4" />
            Responder
          </button>
        </div>
      )}
    </Card>
  );
};

export default CommentsTab;