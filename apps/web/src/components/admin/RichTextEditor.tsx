import type { ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Link2 } from 'lucide-react'
import { useEffect } from 'react'

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo...',
  compact = false,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  compact?: boolean
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '<p></p>',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap gap-1 border-b border-line bg-cream px-2 py-2">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Negrito">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Itálico">
          <Italic size={15} />
        </ToolbarButton>
        {!compact ? (
          <>
            <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Título">
              <Heading2 size={15} />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Subtítulo">
              <span className="text-[11px] font-bold">H3</span>
            </ToolbarButton>
          </>
        ) : null}
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Lista">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Lista numerada">
          <ListOrdered size={15} />
        </ToolbarButton>
        {!compact ? (
          <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Citação">
            <Quote size={15} />
          </ToolbarButton>
        ) : null}
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const previous = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('URL do link', previous ?? 'https://')
            if (url === null) return
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          label="Link"
        >
          <Link2 size={15} />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className={
          compact
            ? 'prose prose-sm max-w-none px-4 py-3 min-h-28 focus:outline-none [&_.tiptap]:min-h-20 [&_.tiptap]:whitespace-pre-wrap [&_.tiptap]:outline-none'
            : 'prose prose-sm max-w-none px-4 py-3 min-h-48 focus:outline-none [&_.tiptap]:min-h-40 [&_.tiptap]:whitespace-pre-wrap [&_.tiptap]:outline-none'
        }
      />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: ReactNode
  onClick: () => void
  active?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 ${active ? 'bg-marian text-white' : 'text-navy hover:bg-white'}`}
    >
      {children}
    </button>
  )
}
