import { useCallback, useEffect } from 'react';
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
  Undo,
  Redo,
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
} from 'lucide-react';

/**
 * TipTapEditor
 * 
 * Editor de texto enriquecido basado en TipTap/ProseMirror.
 * Incluye toolbar completo y soporte para variables Handlebars.
 * 
 * Compatible con TipTap v2.10+ y React 19
 */
const TipTapEditor = ({
  content,
  onChange,
  onSelectionUpdate,
  placeholder = 'Escribe el contenido del reporte...',
  editable = true,
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-400 underline hover:text-primary-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-600 w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-600 p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-600 p-2 bg-bg-tertiary font-semibold',
        },
      }),
      Underline,
    ],
    content,
    editable,
    immediatelyRender: false, // Importante para React 19
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelectionUpdate) {
        onSelectionUpdate({
          from: editor.state.selection.from,
          to: editor.state.selection.to,
          anchor: editor.state.selection.anchor,
        });
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Actualizar contenido cuando cambia desde fuera
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Insertar variable Handlebars
  const insertVariable = useCallback((variable) => {
    if (editor) {
      editor.chain().focus().insertContent(variable).run();
    }
  }, [editor]);

  // Insertar loop
  const insertLoop = useCallback((arrayPath, itemName = 'item') => {
    if (editor) {
      const loopBlock = `{{#each ${arrayPath}}}\n  {{this.${itemName}}}\n{{/each}}`;
      editor.chain().focus().insertContent(loopBlock).run();
    }
  }, [editor]);

  // Insertar condicional
  const insertConditional = useCallback((condition) => {
    if (editor) {
      const conditionalBlock = `{{#if ${condition}}}\n  Contenido si verdadero\n{{/if}}`;
      editor.chain().focus().insertContent(conditionalBlock).run();
    }
  }, [editor]);

  // Agregar link
  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Agregar imagen
  const addImage = useCallback(() => {
    if (!editor) return;
    
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Insertar tabla
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="bg-bg-tertiary rounded-xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Exponer métodos al padre
  editor.insertVariable = insertVariable;
  editor.insertLoop = insertLoop;
  editor.insertConditional = insertConditional;

  return (
    <div className={`bg-bg-secondary border border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-gray-700 p-2 flex flex-wrap gap-1 bg-bg-tertiary">
          {/* Historial */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Deshacer"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rehacer"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Formato de texto */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Negrita"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Cursiva"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Subrayado"
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
              title="Código inline"
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

          {/* Limpiar formato */}
          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Limpiar formato"
          >
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Estilos para el contenido */}
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
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: white;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          color: #d1d5db;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
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
        .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #374151;
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .ProseMirror th, .ProseMirror td {
          border: 1px solid #4b5563;
          padding: 0.5rem;
        }
        .ProseMirror th {
          background: #374151;
          font-weight: 600;
        }
        .ProseMirror mark {
          background: #fbbf24;
          color: #1f2937;
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
        }
      `}</style>
    </div>
  );
};

// Componentes auxiliares del Toolbar
const ToolbarGroup = ({ children }) => (
  <div className="flex items-center gap-0.5">{children}</div>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-gray-600 mx-1" />
);

const ToolbarButton = ({
  children,
  onClick,
  isActive = false,
  disabled = false,
  title,
  size = 'md',
  className = '',
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    type="button"
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

export default TipTapEditor;
