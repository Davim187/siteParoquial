import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminSelect,
  AdminTable,
  AdminTextarea,
  FormSection,
  RowActions,
} from '@/components/admin/AdminUi'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useInvalidateQueries, useNewsCategoriesQuery } from '@/hooks/queries/useAdminQueries'
import { useNewsQuery } from '@/hooks/queries/usePublicQueries'
import { formatValidationSummary, getErrorMessage, getFieldErrors } from '@/lib/api-error'
import { deleteNews, duplicateNews, saveNews, setNewsStatus } from '@/services/newsService'
import type { NewsArticle } from '@/types'
import { formatDate } from '@/utils/dates'

type NewsForm = Omit<NewsArticle, 'id'> & {
  id?: string
  coverMediaId?: string | null
  categoryId?: string | null
}

const empty: NewsForm = {
  slug: '',
  title: '',
  subtitle: '',
  excerpt: '',
  content: '<p></p>',
  author: '[EQUIPE DE COMUNICAÇÃO]',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  category: 'Comunidade',
  categoryId: null,
  status: 'draft',
  coverMediaId: null,
}

export function AdminNewsPage() {
  usePageMeta('Notícias | Admin')
  const toast = useToast()
  const { hasPermission, hasAnyPermission } = useAuth()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useNewsQuery({ includeDrafts: true })
  const categoriesQuery = useNewsCategoriesQuery()
  const [editing, setEditing] = useState<NewsForm | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toDelete, setToDelete] = useState<NewsArticle | null>(null)
  const [saving, setSaving] = useState(false)

  const categories = categoriesQuery.data ?? []

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setFormErrors({})
    try {
      const selectedCategory = categories.find((item) => item.id === editing.categoryId)
      await saveNews({
        ...editing,
        categoryId: editing.categoryId ?? null,
        category: selectedCategory?.name ?? editing.category,
      })
      toast.push('Notícia salva com sucesso.')
      setEditing(null)
      invalidate.news()
    } catch (error) {
      setFormErrors(getFieldErrors(error))
      toast.push(formatValidationSummary(error, 'Não foi possível salvar a notícia.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminCrudShell
      title="Gerenciar notícias"
      createLabel="+ Nova notícia"
      createPermission="NEWS_CREATE"
      onCreate={() => {
        setFormErrors({})
        setEditing({
          ...empty,
          categoryId: categories[0]?.id ?? null,
          category: categories[0]?.name ?? empty.category,
        })
      }}
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Título', 'Categoria', 'Status', 'Data', 'Ações']}
        rows={data?.map((item) => [
          item.title,
          item.category,
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
            onEdit={() => {
              setFormErrors({})
              setEditing(item as NewsForm)
            }}
            onDelete={() => setToDelete(item)}
            onToggle={async () => {
              await setNewsStatus(item.id, item.status === 'published' ? 'DRAFT' : 'PUBLISHED')
              toast.push(item.status === 'published' ? 'Notícia despublicada.' : 'Notícia publicada.')
              invalidate.news()
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
            disabled={!data?.[0]}
            onClick={async () => {
              const first = data?.[0]
              if (!first) return
              await duplicateNews(first.id)
              toast.push('Notícia duplicada como rascunho.')
              invalidate.news()
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
                error={formErrors.title}
                hint="O título aparecerá no topo da notícia."
              />
              <AdminInput
                label="Subtítulo"
                value={editing.subtitle ?? ''}
                onChange={(subtitle) => setEditing({ ...editing, subtitle })}
                error={formErrors.subtitle}
              />
              <AdminSelect
                label="Categoria"
                value={editing.categoryId ?? ''}
                onChange={(categoryId) => {
                  const selected = categories.find((item) => item.id === categoryId)
                  setEditing({
                    ...editing,
                    categoryId: categoryId || null,
                    category: selected?.name ?? editing.category,
                  })
                }}
                options={categories.map((item) => ({ value: item.id, label: item.name }))}
                placeholder={categoriesQuery.isLoading ? 'Carregando categorias...' : 'Selecione uma categoria'}
                error={formErrors.categoryId}
              />
              <AdminInput
                label="Slug"
                value={editing.slug}
                onChange={(slug) => setEditing({ ...editing, slug })}
                error={formErrors.slug}
                hint="Usado na URL pública."
              />
            </FormSection>
            <FormSection title="Conteúdo">
              <AdminTextarea
                label="Resumo"
                value={editing.excerpt}
                onChange={(excerpt) => setEditing({ ...editing, excerpt })}
                required
                error={formErrors.excerpt}
              />
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">
                  Conteúdo <span className="text-red-500">*</span>
                </p>
                <RichTextEditor
                  value={editing.content}
                  onChange={(content) => setEditing({ ...editing, content })}
                />
                {formErrors.content ? (
                  <span className="mt-1.5 block text-xs text-red-600">⚠ {formErrors.content}</span>
                ) : null}
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
                error={formErrors.date}
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
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
          const { id } = toDelete
          try {
            await deleteNews(id)
            await invalidate.news(id)
            invalidate.dashboard()
            toast.push('Notícia excluída.')
          } catch (error) {
            toast.push(getErrorMessage(error, 'Não foi possível excluir a notícia.'), 'error')
            throw error
          }
        }}
      />
    </AdminCrudShell>
  )
}
