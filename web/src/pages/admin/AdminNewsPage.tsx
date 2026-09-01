import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminTable,
  AdminTextarea,
  FormSection,
  RowActions,
} from '@/components/admin/AdminUi'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { deleteNews, duplicateNews, listNews, saveNews, setNewsStatus } from '@/services/newsService'
import type { NewsArticle } from '@/types'
import { formatDate } from '@/utils/dates'

const empty: Omit<NewsArticle, 'id'> & { coverMediaId?: string | null } = {
  slug: '',
  title: '',
  subtitle: '',
  excerpt: '',
  content: '<p></p>',
  author: '[EQUIPE DE COMUNICAÇÃO]',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  category: 'Comunidade',
  status: 'draft',
  coverMediaId: null,
}

export function AdminNewsPage() {
  usePageMeta('Notícias | Admin')
  const toast = useToast()
  const { hasPermission, hasAnyPermission } = useAuth()
  const query = useAsync(() => listNews({ includeDrafts: true }), [])
  const [editing, setEditing] = useState<(Omit<NewsArticle, 'id'> & { id?: string; coverMediaId?: string | null }) | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toDelete, setToDelete] = useState<NewsArticle | null>(null)

  async function refresh() {
    query.setData(await listNews({ includeDrafts: true }))
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    try {
      await saveNews(editing)
      toast.push('Notícia salva com sucesso.')
      setEditing(null)
      await refresh()
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Não foi possível salvar a notícia.', 'error')
    }
  }

  return (
    <AdminCrudShell
      title="Gerenciar notícias"
      createLabel="+ Nova notícia"
      createPermission="NEWS_CREATE"
      onCreate={() => setEditing({ ...empty })}
      loading={query.loading}
      error={query.error}
    >
      <AdminTable
        headers={['Título', 'Status', 'Data', 'Ações']}
        rows={query.data?.map((item) => [
          item.title,
          <StatusBadge
            key={`${item.id}-status`}
            status={
              item.status === 'published' ? 'published' : item.status === 'archived' ? 'archived' : 'draft'
            }
          />,
          formatDate(item.date),
          <RowActions
            key={item.id}
            entityLabel="notícia"
            canEdit={hasAnyPermission('NEWS_EDIT', 'NEWS_MANAGE')}
            canDelete={hasPermission('NEWS_DELETE')}
            canToggle={hasAnyPermission('NEWS_EDIT', 'NEWS_MANAGE')}
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
            onToggle={async () => {
              await setNewsStatus(item.id, item.status === 'published' ? 'DRAFT' : 'PUBLISHED')
              toast.push(item.status === 'published' ? 'Notícia despublicada.' : 'Notícia publicada.')
              await refresh()
            }}
            toggleLabel={item.status === 'published' ? 'Despublicar notícia' : 'Publicar notícia'}
          />,
        ])}
      />
      {hasAnyPermission('NEWS_CREATE', 'NEWS_MANAGE') ? (
        <div className="mt-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={!query.data?.[0]}
            onClick={async () => {
              const first = query.data?.[0]
              if (!first) return
              await duplicateNews(first.id)
              toast.push('Notícia duplicada como rascunho.')
              await refresh()
            }}
          >
            Duplicar primeira da lista
          </Button>
        </div>
      ) : null}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar notícia' : 'Nova notícia'}>
        {editing ? (
          <form className="max-h-[75vh] space-y-4 overflow-y-auto pr-1" onSubmit={onSave}>
            <FormSection title="Informações básicas">
              <AdminInput
                label="Título"
                value={editing.title}
                onChange={(title) => setEditing({ ...editing, title })}
                required
                hint="O título aparecerá no topo da notícia."
              />
              <AdminInput
                label="Subtítulo"
                value={editing.subtitle ?? ''}
                onChange={(subtitle) => setEditing({ ...editing, subtitle })}
              />
              <AdminInput
                label="Categoria"
                value={editing.category}
                onChange={(category) => setEditing({ ...editing, category })}
              />
              <AdminInput
                label="Slug"
                value={editing.slug}
                onChange={(slug) => setEditing({ ...editing, slug })}
                hint="Usado na URL pública."
              />
            </FormSection>
            <FormSection title="Conteúdo">
              <AdminTextarea
                label="Resumo"
                value={editing.excerpt}
                onChange={(excerpt) => setEditing({ ...editing, excerpt })}
              />
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Editor</p>
                <RichTextEditor
                  value={editing.content}
                  onChange={(content) => setEditing({ ...editing, content })}
                />
              </div>
            </FormSection>
            <FormSection title="Imagem">
              <div className="flex flex-wrap items-center gap-3">
                {editing.image ? (
                  <img src={editing.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
                ) : null}
                <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                  Escolher imagem de capa
                </Button>
              </div>
            </FormSection>
            <FormSection title="Publicação">
              <AdminInput
                label="Data"
                type="date"
                value={editing.date}
                onChange={(date) => setEditing({ ...editing, date })}
              />
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">Status</span>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as NewsArticle['status'] })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </label>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          setEditing({
            ...editing,
            image: media.url,
            coverMediaId: media.id,
          })
          setPickerOpen(false)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir notícia?"
        description={`Você está prestes a excluir "${toDelete?.title ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteNews(toDelete.id)
          toast.push('Notícia excluída.')
          setToDelete(null)
          await refresh()
        }}
      />
    </AdminCrudShell>
  )
}
