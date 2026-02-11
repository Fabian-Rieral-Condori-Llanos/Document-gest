import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  RemoveFormatting,
  Code2,
  Braces,
  Save,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useReportCollaboration } from '../../hooks/useReportCollaboration';
import { CollaboratorsList } from './index';

/**
 * CollaborativeEditor
 * 
 * Editor TipTap con colaboración en tiempo real usando Y.js y Socket.io.
 * Muestra cursores de otros usuarios y sincroniza cambios automáticamente.
 * 
 * Compatible con TipTap v2.10+ y React 19
 */
const CollaborativeEditor = ({
  reportInstanceId,
  currentUser,
  initialContent,
  onContentChange,
  onSave,
  placeholder = 'Escribe el contenido del reporte...',
  readOnly = false,
  className = '',
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Hook de colaboración
  const {
    isReady,
    isConnected,
    lastSaved,
    ydoc,
    sendCursor,
    save: saveToServer,
    resync,
  } = useReportCollaboration(reportInstanceId, {
    autoConnect: true,
    onContentChange: (content) => {
      if (onContentChange) onContentChange(content);
    },
  });

  // Crear documento Y.js si no existe
  const yDoc = useMemo(() => ydoc || new Y.Doc(), [ydoc]);

  // Color único para el usuario actual
  const userColor = useMemo(() => {
    const colors = [
      '#f87171', '#fb923c', '#fbbf24', '#a3e635',
      '#34d399', '#22d3ee', '#818cf8', '#e879f9',
    ];
    const hash = currentUser?.username?.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) || 0;
    return colors[Math.abs(hash) % colors.length];
  }, [currentUser]);

  // Configurar editor TipTap con colaboración
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Deshabilitado porque Y.js maneja el historial
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary-400 underline hover:text-primary-300' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: { class: 'border border-gray-600 p-2' },
      }),
      TableHeader.configure({
        HTMLAttributes: { class: 'border border-gray-600 p-2 bg-bg-tertiary font-semibold' },
      }),
      Underline,
      // Colaboración
      Collaboration.configure({
        document: yDoc,
        field: 'content',
      }),
      CollaborationCursor.configure({
        provider: null, // El provider se configura manualmente
        user: {
          name: currentUser?.username || 'Anónimo',
          color: userColor,
        },
      }),
    ],
    editable: !readOnly,
    immediatelyRender: false, // Importante para React 19
    onSelectionUpdate: ({ editor }) => {
      if (sendCursor && editor) {
        const { from, to } = editor.state.selection;
        sendCursor(editor.state.selection.anchor, { from, to });
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Cargar contenido inicial si existe y no hay colaboración activa
  useEffect(() => {
    if (editor && initialContent && !isReady) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent, isReady]);

  // Actualizar último guardado
  useEffect(() => {
    if (lastSaved) {
      setLastSavedAt(new Date(lastSaved));
    }
  }, [lastSaved]);

  // Guardar contenido
  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const content = editor.getJSON();
      if (saveToServer) {
        await saveToServer();
      }
      if (onSave) {
        await onSave(content);
      }
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Insertar variable
  const insertVariable = (variable) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
    }
  };

  // Agregar link
  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Agregar imagen
  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Insertar tabla
  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) {
    return (
      <div className="bg-bg-tertiary rounded-xl p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Cargando editor...</p>
        </div>
      </div>
    );
  }

  // Exponer método para insertar variables
  editor.insertVariable = insertVariable;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header con colaboradores y acciones */}
      <div className="bg-bg-secondary border border-gray-700 border-b-0 rounded-t-xl px-4 py-3 flex items-center justify-between">
        <CollaboratorsList compact />
        
        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-xs text-gray-500">
              Guardado: {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          
          <button
            type="button"
            onClick={resync}
            disabled={!isConnected}
            className="p-2 text-gray-400 hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
            title="Resincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-bg-secondary border border-gray-700 rounded-b-xl overflow-hidden flex-1 flex flex-col">
        {/* Toolbar */}
        {!readOnly && (
          <div className="border-b border-gray-700 p-2 flex flex-wrap gap-1 bg-bg-tertiary">
            {/* Formato de texto */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Negrita (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Cursiva (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Subrayado (Ctrl+U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Tachado"
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                title="Resaltar"
              >
                <Highlighter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Código"
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Encabezados */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Título 1"
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Título 2"
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Título 3"
              >
                <Heading3 className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Listas */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Lista con viñetas"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Lista numerada"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Cita"
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="Bloque de código"
              >
                <Code2 className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Alineación */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Alinear izquierda"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Centrar"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Alinear derecha"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Justificar"
              >
                <AlignJustify className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Insertar */}
            <ToolbarGroup>
              <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Enlace">
                <LinkIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={addImage} title="Imagen">
                <ImageIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={insertTable} title="Tabla">
                <TableIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Línea horizontal"
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />

            {/* Variables */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  const variable = window.prompt('Variable (ej: audit.name):');
                  if (variable) insertVariable(`{{${variable}}}`);
                }}
                title="Insertar variable"
                className="text-accent-400"
              >
                <Braces className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <div className="flex-1" />

            {/* Limpiar */}
            <ToolbarButton
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              title="Limpiar formato"
            >
              <RemoveFormatting className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; color: white; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; color: white; }
        .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: white; }
        .ProseMirror p { margin-bottom: 0.75rem; color: #d1d5db; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .ProseMirror li { margin-bottom: 0.25rem; }
        .ProseMirror blockquote {
          border-left: 3px solid #10b981;
          padding-left: 1rem;
          margin-left: 0;
          color: #9ca3af;
          font-style: italic;
        }
        .ProseMirror code {
          background: #374151;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .ProseMirror pre {
          background: #1f2937;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .ProseMirror pre code { background: none; padding: 0; }
        .ProseMirror hr { border: none; border-top: 1px solid #374151; margin: 1.5rem 0; }
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #4b5563; padding: 0.5rem; }
        .ProseMirror th { background: #374151; font-weight: 600; }
        .ProseMirror mark { background: #fbbf24; color: #1f2937; padding: 0.125rem 0.25rem; border-radius: 0.125rem; }
        
        /* Cursor de colaboración */
        .collaboration-cursor__caret {
          position: relative;
          margin-left: -1px;
          margin-right: -1px;
          border-left: 1px solid;
          word-break: normal;
          pointer-events: none;
        }
        .collaboration-cursor__label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          user-select: none;
          color: white;
          padding: 0.1rem 0.3rem;
          border-radius: 3px 3px 3px 0;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

// Componentes auxiliares
const ToolbarGroup = ({ children }) => <div className="flex items-center gap-0.5">{children}</div>;
const ToolbarDivider = () => <div className="w-px h-6 bg-gray-600 mx-1" />;
const ToolbarButton = ({ children, onClick, isActive, disabled, title, size = 'md', className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      ${size === 'sm' ? 'p-1.5' : 'p-2'}
      rounded transition-colors
      ${isActive ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-bg-secondary'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `}
  >
    {children}
  </button>
);

export default CollaborativeEditor;
