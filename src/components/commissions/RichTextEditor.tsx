// src/components/commissions/RichTextEditor.tsx - CORRIGIDO
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ToolbarButton({ 
  onClick, 
  active = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  children: React.ReactNode; 
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded text-sm transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
          : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor(props: RichTextEditorProps) {
  // Atribui a uma variável com prefixo underscore para satisfazer o TypeScript/ESLint
  // mantendo a compatibilidade com a interface.
  const { value, onChange, placeholder: _placeholder } = props;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 shadow-lg',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-gray-700 dark:text-gray-200',
        style: "font-family: 'Lora', Georgia, serif; line-height: 1.85;",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="rich-text-editor border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado">
            <u>S</u>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
            <s>T</s>
          </ToolbarButton>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <div className="flex gap-0.5">
          {[1, 2, 3].map(level => (
            <ToolbarButton
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
              active={editor.isActive('heading', { level })}
              title={`Título ${level}`}
            >
              H{level}
            </ToolbarButton>
          ))}
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <div className="flex gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
            • Lista
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
            1. Lista
          </ToolbarButton>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <div className="flex gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Esquerda">
            ⬅
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centro">
            ⬌
          </ToolbarButton>
        </div>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação">
          ❝
        </ToolbarButton>

        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <div className="flex gap-0.5">
          <ToolbarButton onClick={addLink} title="Link">🔗</ToolbarButton>
          <ToolbarButton onClick={addImage} title="Imagem">🖼️</ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .rich-text-editor .ProseMirror {
          min-height: 200px;
          outline: none;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          float: left;
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor h1 { font-size: 1.8em; font-weight: 700; margin: 1em 0 0.5em; font-family: 'Playfair Display', Georgia, serif; color: #4a3728; }
        .rich-text-editor h2 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; font-family: 'Playfair Display', Georgia, serif; color: #4a3728; }
        .rich-text-editor h3 { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.4em; color: #4a3728; }
        .rich-text-editor ul, .rich-text-editor ol { padding-left: 1.5em; margin: 0.5em 0; }
        .rich-text-editor li { margin-bottom: 0.25em; }
        .rich-text-editor blockquote { border-left: 4px solid #c8a97e; padding-left: 1em; margin: 1em 0; color: #6b4c2e; font-style: italic; }
        .rich-text-editor img { max-width: 100%; border-radius: 0.75rem; margin: 1em 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .rich-text-editor a { color: #2563eb; text-decoration: underline; }
        .dark .rich-text-editor h1, .dark .rich-text-editor h2, .dark .rich-text-editor h3 { color: #f3f4f6; }
        .dark .rich-text-editor blockquote { color: #d1d5db; border-left-color: #f5c97a; }
      `}</style>
    </div>
  );
}