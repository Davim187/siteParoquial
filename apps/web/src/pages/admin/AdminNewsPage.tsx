import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminSelect,
  AdminTable,
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
  excerpt: '<p></p>',
  content: '<p></p>',
  author: '[EQUIPE DE COMUNICAÇÃO]',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  category: 'Comunidade',
  categoryId: null,
  status: 'draft',
  featured: false,
  coverMediaId: null,
  gallery: [],
  galleryMediaIds: [],
  showProgress: false,
  progressMode: 'amount',
  progressLabel: 'Arrecadação para o novo Centro Pastoral',
  progressCurrent: 0,
  progressGoal: 0,
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
  const [pickerMode, setPickerMode] = useState<'cover' | 'gallery'>('cover')
  const [toDelete, setToDelete] = useState<NewsArticle | null>(null)
  const [saving, setSaving] = useState(false)
  const togglingIds = useRef(new Set<string>())
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(() => new Set())

  const categories = categoriesQuery.data ?? []

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setFormErrors({})
    try {
      const selectedCategory = categories.find((item) => item.id === editing.categoryId)
      const saved = await saveNews({
        ...editing,
        categoryId: editing.categoryId ?? null,
        category: selectedCategory?.name ?? editing.category,
      })
      toast.push('Notícia salva com sucesso.')
      setEditing(null)
      invalidate.patchNews(saved)
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
        headers={['Título', 'Categoria', 'Status', 'Destaque', 'Data', 'Ações']}
        rows={data?.map((item) => [
          item.title,
          item.category,
          <StatusBadge
            key={`${item.id}-status`}
            status={
              item.status === 'published' ? 'published' : item.status === 'archived' ? 'archived' : 'draft'
            }
          />,
          item.featured ? 'Sim' : 'Não',
          formatDate(item.date),
          <RowActions
            key={item.id}
            entityLabel="notícia"
            canEdit={hasAnyPermission('NEWS_EDIT', 'NEWS_MANAGE')}
            canDelete={hasPermission('NEWS_DELETE')}
            canToggle={hasAnyPermission('NEWS_EDIT', 'NEWS_MANAGE')}
            onEdit={() => {
              setFormErrors({})
              setEditing({
                ...empty,
                ...item,
                gallery: item.gallery ?? [],
                galleryMediaIds: item.galleryMediaIds ?? [],
                progressLabel: item.progressLabel || empty.progressLabel,
                progressMode: item.progressMode === 'percent' ? 'percent' : 'amount',
              })
            }}
            onDelete={() => setToDelete(item)}
            canDuplicate={hasAnyPermission('NEWS_CREATE', 'NEWS_MANAGE')}
            duplicating={duplicatingIds.has(item.id)}
            onDuplicate={() => {
              if (duplicatingIds.has(item.id)) return
              setDuplicatingIds((current) => new Set(current).add(item.id))
              void duplicateNews(item.id)
                .then((copy) => {
                  invalidate.patchNews(copy)
                  toast.push('Notícia duplicada como rascunho.')
                })
                .catch((error) => {
                  toast.push(getErrorMessage(error, 'Não foi possível duplicar a notícia.'), 'error')
                })
                .finally(() => {
                  setDuplicatingIds((current) => {
                    const next = new Set(current)
                    next.delete(item.id)
                    return next
                  })
                })
            }}
            onToggle={() => {
              if (togglingIds.current.has(item.id)) return
              togglingIds.current.add(item.id)
              const nextStatus = item.status === 'published' ? 'draft' : 'published'
              invalidate.patchNews({ ...item, status: nextStatus })
              toast.push(nextStatus === 'published' ? 'Notícia publicada.' : 'Notícia despublicada.')
              void setNewsStatus(item.id, nextStatus === 'published' ? 'PUBLISHED' : 'DRAFT')
                .then((updated) => invalidate.patchNews(updated))
                .catch((error) => {
                  invalidate.patchNews(item)
                  toast.push(getErrorMessage(error, 'Não foi possível atualizar o status.'), 'error')
                })
                .finally(() => togglingIds.current.delete(item.id))
            }}
            toggleLabel={item.status === 'published' ? 'Despublicar notícia' : 'Publicar notícia'}
          />,
        ])}
      />

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
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">
                  Resumo <span className="text-red-500">*</span>
                </p>
                <p className="mb-2 text-xs text-slate-500">
                  Texto curto exibido nos cards. Use negrito, itálico e quebras de linha conforme digitado.
                </p>
                <RichTextEditor
                  compact
                  value={editing.excerpt}
                  onChange={(excerpt) => setEditing({ ...editing, excerpt })}
                  placeholder="Resumo da notícia..."
                />
                {formErrors.excerpt ? (
                  <span className="mt-1.5 block text-xs text-red-600">⚠ {formErrors.excerpt}</span>
                ) : null}
              </div>
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
            <FormSection title="Imagens">
              <div className="flex flex-wrap items-center gap-3">
                {editing.image ? (
                  <img src={editing.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPickerMode('cover')
                    setPickerOpen(true)
                  }}
                >
                  Escolher imagem de capa
                </Button>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Galeria da notícia</p>
                <p className="mb-3 text-xs text-slate-500">Adicione várias fotos da obra, da campanha ou do evento.</p>
                <div className="flex flex-wrap gap-2">
                  {(editing.gallery ?? []).map((src, index) => (
                    <div key={`${src}-${index}`} className="relative">
                      <img src={src} alt="" className="h-20 w-24 rounded-lg object-cover" />
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            gallery: (editing.gallery ?? []).filter((_, i) => i !== index),
                            galleryMediaIds: (editing.galleryMediaIds ?? []).filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPickerMode('gallery')
                      setPickerOpen(true)
                    }}
                  >
                    + Adicionar imagem
                  </Button>
                </div>
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
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(editing.featured)}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-slate-700">Destaque na home e na listagem</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Apenas uma notícia fica em destaque. Ao marcar esta, as outras deixam de ser destaque.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={Boolean(editing.showProgress)}
                  onChange={(e) => setEditing({ ...editing, showProgress: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-slate-700">Barra de progresso (obra / arrecadação)</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Use para campanhas como a construção do novo Centro Pastoral. A campanha aparece em destaque na home.
                  </span>
                </span>
              </label>
              {editing.showProgress ? (
                <div className="grid gap-3 rounded-xl border border-gold/30 bg-gold/5 p-3">
                  <AdminInput
                    label="Título da campanha"
                    value={editing.progressLabel ?? ''}
                    onChange={(progressLabel) => setEditing({ ...editing, progressLabel })}
                  />
                  <AdminSelect
                    label="Tipo de progresso"
                    value={editing.progressMode === 'percent' ? 'percent' : 'amount'}
                    onChange={(progressMode) =>
                      setEditing({
                        ...editing,
                        progressMode: progressMode === 'percent' ? 'percent' : 'amount',
                        progressGoal: progressMode === 'percent' ? 100 : editing.progressGoal,
                      })
                    }
                    options={[
                      { value: 'amount', label: 'Por valores (R$)' },
                      { value: 'percent', label: 'Por porcentagem (%)' },
                    ]}
                    hint="Escolha se a barra usa arrecadação em reais ou apenas o percentual concluído."
                  />
                  {editing.progressMode === 'percent' ? (
                    <AdminInput
                      label="Progresso (%)"
                      type="number"
                      value={String(editing.progressCurrent ?? 0)}
                      onChange={(progressCurrent) => {
                        const value = Number(progressCurrent)
                        setEditing({
                          ...editing,
                          progressCurrent: Number.isFinite(value)
                            ? Math.min(100, Math.max(0, value))
                            : 0,
                          progressGoal: 100,
                        })
                      }}
                      hint="Informe um número de 0 a 100."
                    />
                  ) : (
                    <>
                      <AdminInput
                        label="Valor arrecadado (R$)"
                        type="number"
                        value={String(editing.progressCurrent ?? 0)}
                        onChange={(progressCurrent) =>
                          setEditing({ ...editing, progressCurrent: Number(progressCurrent) || 0 })
                        }
                      />
                      <AdminInput
                        label="Meta (R$)"
                        type="number"
                        value={String(editing.progressGoal ?? 0)}
                        onChange={(progressGoal) =>
                          setEditing({ ...editing, progressGoal: Number(progressGoal) || 0 })
                        }
                      />
                    </>
                  )}
                </div>
              ) : null}
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
          if (pickerMode === 'gallery') {
            if ((editing.galleryMediaIds ?? []).includes(media.id)) {
              setPickerOpen(false)
              return
            }
            setEditing({
              ...editing,
              gallery: [...(editing.gallery ?? []), media.url],
              galleryMediaIds: [...(editing.galleryMediaIds ?? []), media.id],
            })
          } else {
            setEditing({
              ...editing,
              image: media.url,
              coverMediaId: media.id,
            })
          }
          setPickerOpen(false)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir notícia?"
        description={`Você está prestes a excluir "${toDelete?.title ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          const snapshot = toDelete
          invalidate.removeNews(snapshot.id)
          void deleteNews(snapshot.id)
            .then(() => {
              invalidate.dashboard()
              toast.push('Notícia excluída.')
            })
            .catch((error) => {
              invalidate.patchNews(snapshot)
              toast.push(getErrorMessage(error, 'Não foi possível excluir a notícia.'), 'error')
            })
        }}
      />
    </AdminCrudShell>
  )
}
