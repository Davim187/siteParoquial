import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminTable,
  AdminTextarea,
  RowActions,
} from '@/components/admin/AdminUi'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ui/Toast'
import { uploadMedia } from '@/services/mediaService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { deletePastoral, listPastorals, savePastoral } from '@/services/pastoralService'
import { deleteSacrament, listSacraments, saveSacrament } from '@/services/sacramentService'
import { deleteGalleryItem, listGallery, saveGalleryItem } from '@/services/galleryService'
import { deletePerson, listPeople, savePerson } from '@/services/parishService'
import {
  deletePrayerRequest,
  listPrayerRequests,
  updatePrayerStatus,
} from '@/services/prayerService'
import { deleteMessage, listMessages, updateMessageStatus } from '@/services/contactService'
import { getFeast, getSettings, saveFeast, saveSettings } from '@/services/parishService'
import type { ContactMessage, GalleryCategory, Pastoral, Person, Sacrament } from '@/types'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { messageStatusLabels } from '@/utils/labels'
import { formatDateTime } from '@/utils/dates'

function DeleteConfirm({
  open,
  label,
  onClose,
  onConfirm,
}: {
  open: boolean
  label: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Excluir registro?"
      description={`Você está prestes a excluir "${label}". Essa ação não poderá ser desfeita.`}
      onClose={onClose}
      onConfirm={() => void onConfirm()}
    />
  )
}

export function AdminPastoralsPage() {
  usePageMeta('Pastorais | Admin')
  const query = useAsync(() => listPastorals({ includeInactive: true }), [])
  const [editing, setEditing] = useState<(Omit<Pastoral, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Pastoral | null>(null)

  async function refresh() {
    query.setData(await listPastorals({ includeInactive: true }))
  }

  return (
    <AdminCrudShell
      title="Pastorais"
      onCreate={() =>
        setEditing({
          name: '',
          description: '',
          image: '',
          responsible: '[RESPONSÁVEL]',
          contact: '[CONTATO]',
          meetingTime: '[HORÁRIO]',
          location: '[LOCAL]',
          active: true,
        })
      }
      loading={query.loading}
      error={query.error}
    >
      <AdminTable
        headers={['Nome', 'Ativa', 'Ações']}
        rows={query.data?.map((item) => [
          item.name,
          item.active ? 'Sim' : 'Não',
          <RowActions
            key={item.id}
            entityLabel="pastoral"
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.name ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deletePastoral(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Pastoral">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await savePastoral(editing)
              setEditing(null)
              await refresh()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminTextarea
              label="Descrição"
              value={editing.description}
              onChange={(description) => setEditing({ ...editing, description })}
            />
            <AdminInput label="Imagem" value={editing.image} onChange={(image) => setEditing({ ...editing, image })} />
            <AdminInput
              label="Responsável"
              value={editing.responsible}
              onChange={(responsible) => setEditing({ ...editing, responsible })}
            />
            <AdminInput
              label="Contato"
              value={editing.contact}
              onChange={(contact) => setEditing({ ...editing, contact })}
            />
            <AdminInput
              label="Horário"
              value={editing.meetingTime}
              onChange={(meetingTime) => setEditing({ ...editing, meetingTime })}
            />
            <AdminInput
              label="Local"
              value={editing.location}
              onChange={(location) => setEditing({ ...editing, location })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Ativa
            </label>
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
    </AdminCrudShell>
  )
}

export function AdminSacramentsPage() {
  usePageMeta('Sacramentos | Admin')
  const query = useAsync(() => listSacraments(), [])
  const [editing, setEditing] = useState<(Omit<Sacrament, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Sacrament | null>(null)

  async function refresh() {
    query.setData(await listSacraments())
  }

  return (
    <AdminCrudShell title="Sacramentos" loading={query.loading} error={query.error}>
      <AdminTable
        headers={['Nome', 'Ações']}
        rows={query.data?.map((item) => [
          item.name,
          <RowActions
            key={item.id}
            entityLabel="sacramento"
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.name ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteSacrament(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Sacramento">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await saveSacrament(editing)
              setEditing(null)
              await refresh()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminTextarea label="Resumo" value={editing.summary} onChange={(summary) => setEditing({ ...editing, summary })} />
            <AdminTextarea label="O que é" value={editing.whatItIs} onChange={(whatItIs) => setEditing({ ...editing, whatItIs })} />
            <AdminTextarea
              label="Quem pode receber"
              value={editing.whoCanReceive}
              onChange={(whoCanReceive) => setEditing({ ...editing, whoCanReceive })}
            />
            <AdminTextarea
              label="Como funciona"
              value={editing.howItWorks}
              onChange={(howItWorks) => setEditing({ ...editing, howItWorks })}
            />
            <AdminTextarea
              label="Documentos (um por linha)"
              value={editing.documents.join('\n')}
              onChange={(value) => setEditing({ ...editing, documents: value.split('\n').filter(Boolean) })}
            />
            <AdminTextarea
              label="Inscrição"
              value={editing.howToRegister}
              onChange={(howToRegister) => setEditing({ ...editing, howToRegister })}
            />
            <AdminInput
              label="Contato secretaria"
              value={editing.secretaryContact}
              onChange={(secretaryContact) => setEditing({ ...editing, secretaryContact })}
            />
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
    </AdminCrudShell>
  )
}

export function AdminGalleryPage() {
  usePageMeta('Galeria | Admin')
  const query = useAsync(() => listGallery('todas'), [])
  const [editing, setEditing] = useState<{
    id?: string
    title: string
    src: string
    alt: string
    category: GalleryCategory
    date: string
  } | null>(null)
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null)

  async function refresh() {
    query.setData(await listGallery('todas'))
  }

  return (
    <AdminCrudShell
      title="Galeria"
      onCreate={() =>
        setEditing({
          title: '',
          src: '',
          alt: '',
          category: 'eventos',
          date: new Date().toISOString().slice(0, 10),
        })
      }
      loading={query.loading}
      error={query.error}
    >
      <AdminTable
        headers={['Título', 'Categoria', 'Ações']}
        rows={query.data?.map((item) => [
          item.title,
          item.category,
          <RowActions
            key={item.id}
            entityLabel="foto"
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.title ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteGalleryItem(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Foto">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await saveGalleryItem(editing)
              setEditing(null)
              await refresh()
            }}
          >
            <AdminInput label="Título" value={editing.title} onChange={(title) => setEditing({ ...editing, title })} />
            <AdminInput label="URL da imagem" value={editing.src} onChange={(src) => setEditing({ ...editing, src })} />
            <AdminInput label="Texto alternativo" value={editing.alt} onChange={(alt) => setEditing({ ...editing, alt })} />
            <AdminInput label="Data" type="date" value={editing.date} onChange={(date) => setEditing({ ...editing, date })} />
            <label className="text-sm">
              Categoria
              <select
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as GalleryCategory })}
              >
                <option value="missas">Missas</option>
                <option value="eventos">Eventos</option>
                <option value="festa-padroeira">Festa da Padroeira</option>
                <option value="semana-santa">Semana Santa</option>
                <option value="catequese">Catequese</option>
                <option value="juventude">Juventude</option>
                <option value="pastorais">Pastorais</option>
                <option value="acoes-sociais">Ações sociais</option>
              </select>
            </label>
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
    </AdminCrudShell>
  )
}

export function AdminPeoplePage() {
  usePageMeta('Pessoas | Admin')
  const toast = useToast()
  const query = useAsync(() => listPeople(), [])
  const [editing, setEditing] = useState<(Omit<Person, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Person | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const usesPhotoUpload = editing?.type === 'padre' || editing?.type === 'diacono'

  async function refresh() {
    query.setData(await listPeople())
  }

  return (
    <AdminCrudShell title="Pessoas" loading={query.loading} error={query.error}>
      <AdminTable
        headers={['Nome', 'Função', 'Ações']}
        rows={query.data?.map((item) => [
          item.name,
          item.role,
          <RowActions
            key={item.id}
            entityLabel="pessoa"
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.name ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deletePerson(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Pessoa">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await savePerson(editing)
              setEditing(null)
              await refresh()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminInput label="Função" value={editing.role} onChange={(role) => setEditing({ ...editing, role })} />
            {usesPhotoUpload ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Foto</p>
                <div className="flex flex-wrap items-center gap-3">
                  {editing.photo ? (
                    <img
                      src={editing.photo}
                      alt=""
                      className="h-24 w-24 rounded-full border border-line object-cover"
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                      {uploadingPhoto ? 'Enviando...' : 'Enviar arquivo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (!file) return
                          setUploadingPhoto(true)
                          try {
                            const media = await uploadMedia(file, 'people')
                            setEditing({ ...editing, photo: media.url, photoId: media.id })
                            toast.push('Foto enviada com sucesso.')
                          } catch (error) {
                            toast.push(
                              error instanceof Error ? error.message : 'Falha ao enviar foto',
                              'error',
                            )
                          } finally {
                            setUploadingPhoto(false)
                          }
                        }}
                      />
                    </label>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                      Biblioteca de mídia
                    </Button>
                    {editing.photo ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing({ ...editing, photo: '', photoId: null })}
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted">Envie JPG, PNG, WebP ou HEIC (iPhone) do computador (até 8 MB).</p>
              </div>
            ) : (
              <AdminInput label="Foto" value={editing.photo} onChange={(photo) => setEditing({ ...editing, photo })} />
            )}
            <AdminTextarea label="Biografia" value={editing.bio} onChange={(bio) => setEditing({ ...editing, bio })} />
            <AdminInput
              label="Frase"
              value={editing.quote ?? ''}
              onChange={(quote) => setEditing({ ...editing, quote })}
            />
            <AdminInput
              label="Atendimento"
              value={editing.attendance ?? ''}
              onChange={(attendance) => setEditing({ ...editing, attendance })}
            />
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          setEditing({ ...editing, photo: media.url, photoId: media.id })
          setPickerOpen(false)
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminPrayersPage() {
  usePageMeta('Orações | Admin')
  const query = useAsync(() => listPrayerRequests(), [])
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)

  async function refresh() {
    query.setData(await listPrayerRequests())
  }

  return (
    <AdminCrudShell title="Pedidos de oração" loading={query.loading} error={query.error}>
      <AdminTable
        headers={['Nome', 'Pedido', 'Status', 'Ações']}
        rows={query.data?.map((item) => [
          item.name,
          item.request,
          item.status,
          <RowActions
            key={item.id}
            entityLabel="pedido"
            onToggle={async () => {
              await updatePrayerStatus(item.id, item.status === 'new' ? 'prayed' : 'archived')
              await refresh()
            }}
            toggleLabel="Atualizar status"
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.name ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deletePrayerRequest(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminMessagesPage() {
  usePageMeta('Mensagens | Admin')
  const query = useAsync(() => listMessages(), [])
  const [viewing, setViewing] = useState<ContactMessage | null>(null)
  const [toDelete, setToDelete] = useState<{ id: string; subject: string } | null>(null)

  async function refresh() {
    query.setData(await listMessages())
  }

  function nextStatus(status: ContactMessage['status']): ContactMessage['status'] | null {
    if (status === 'new') return 'read'
    if (status === 'read') return 'replied'
    return null
  }

  function nextStatusLabel(status: ContactMessage['status']) {
    if (status === 'new') return 'Marcar como lida'
    if (status === 'read') return 'Marcar como respondida'
    return 'Atualizar status'
  }

  return (
    <AdminCrudShell title="Mensagens" loading={query.loading} error={query.error}>
      <AdminTable
        headers={['Nome', 'Assunto', 'Status', 'Ações']}
        rows={query.data?.map((item) => [
          item.name,
          item.subject,
          <StatusBadge key={`${item.id}-status`} status={item.status} label={messageStatusLabels[item.status]} />,
          <RowActions
            key={item.id}
            entityLabel="mensagem"
            onView={() => setViewing(item)}
            onToggle={
              nextStatus(item.status)
                ? async () => {
                    const next = nextStatus(item.status)
                    if (!next) return
                    await updateMessageStatus(item.id, next)
                    await refresh()
                  }
                : undefined
            }
            canToggle={Boolean(nextStatus(item.status))}
            toggleLabel={nextStatusLabel(item.status)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.subject : 'Mensagem'}
      >
        {viewing ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={viewing.status} label={messageStatusLabels[viewing.status]} />
              <span className="text-slate-400">{formatDateTime(viewing.createdAt)}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Nome</dt>
                <dd className="mt-1 text-slate-800">{viewing.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">E-mail</dt>
                <dd className="mt-1 text-slate-800">
                  <a href={`mailto:${viewing.email}`} className="text-marian hover:underline">
                    {viewing.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Telefone</dt>
                <dd className="mt-1 text-slate-800">{viewing.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Assunto</dt>
                <dd className="mt-1 text-slate-800">{viewing.subject}</dd>
              </div>
            </dl>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Mensagem</dt>
              <dd className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed whitespace-pre-wrap text-slate-800">
                {viewing.message}
              </dd>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              {nextStatus(viewing.status) ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const next = nextStatus(viewing.status)
                    if (!next) return
                    await updateMessageStatus(viewing.id, next)
                    await refresh()
                    setViewing({ ...viewing, status: next })
                  }}
                >
                  {nextStatusLabel(viewing.status)}
                </Button>
              ) : null}
              <Button type="button" onClick={() => setViewing(null)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <DeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.subject ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteMessage(toDelete.id)
          setToDelete(null)
          await refresh()
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminFeastPage() {
  usePageMeta('Festa | Admin')
  const query = useAsync(() => getFeast(), [])
  const [saving, setSaving] = useState(false)

  if (query.loading) return <Loading />
  if (query.error || !query.data) return <ErrorState message={query.error ?? 'Erro'} />

  const feast = query.data

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Festa da Padroeira</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          await saveFeast(feast)
          setSaving(false)
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={feast.enabled}
            onChange={(e) => query.setData({ ...feast, enabled: e.target.checked })}
          />
          Exibir banner especial na página inicial
        </label>
        <AdminInput
          label="Título"
          value={feast.title}
          onChange={(title) => query.setData({ ...feast, title })}
        />
        <AdminInput
          label="Data (rótulo)"
          value={feast.dateLabel}
          onChange={(dateLabel) => query.setData({ ...feast, dateLabel })}
        />
        <AdminTextarea
          label="Descrição"
          value={feast.description}
          onChange={(description) => query.setData({ ...feast, description })}
        />
        <p className="text-sm text-muted">
          A programação detalhada pode ser ampliada futuramente. Itens atuais: {feast.program.length}.
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  )
}

export function AdminSettingsPage() {
  usePageMeta('Configurações | Admin')
  const query = useAsync(() => getSettings(), [])
  const [saving, setSaving] = useState(false)

  if (query.loading) return <Loading />
  if (query.error || !query.data) return <ErrorState message={query.error ?? 'Erro'} />
  const settings = query.data

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Configurações</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          await saveSettings(settings)
          setSaving(false)
        }}
      >
        <AdminInput label="Nome" value={settings.name} onChange={(name) => query.setData({ ...settings, name })} />
        <AdminInput
          label="Slogan"
          value={settings.slogan}
          onChange={(slogan) => query.setData({ ...settings, slogan })}
        />
        <AdminTextarea
          label="Texto de boas-vindas"
          value={settings.welcomeText}
          onChange={(welcomeText) => query.setData({ ...settings, welcomeText })}
        />
        <AdminInput
          label="Endereço"
          value={settings.address}
          onChange={(address) => query.setData({ ...settings, address })}
        />
        <AdminInput
          label="URL do mapa"
          value={settings.mapsUrl}
          onChange={(mapsUrl) => query.setData({ ...settings, mapsUrl })}
          hint="Link do Google Maps usado no botão Como chegar (página de contato)."
        />
        <AdminInput label="Telefone" value={settings.phone} onChange={(phone) => query.setData({ ...settings, phone })} />
        <AdminInput
          label="WhatsApp"
          value={settings.whatsapp}
          onChange={(whatsapp) => query.setData({ ...settings, whatsapp })}
        />
        <AdminInput label="E-mail" value={settings.email} onChange={(email) => query.setData({ ...settings, email })} />
        <AdminInput
          label="Instagram"
          value={settings.instagram}
          onChange={(instagram) => query.setData({ ...settings, instagram })}
        />
        <AdminInput
          label="Facebook"
          value={settings.facebook}
          onChange={(facebook) => query.setData({ ...settings, facebook })}
        />
        <AdminInput
          label="YouTube"
          value={settings.youtube}
          onChange={(youtube) => query.setData({ ...settings, youtube })}
        />
        <AdminInput
          label="Horário da secretaria"
          value={settings.secretaryHours}
          onChange={(secretaryHours) => query.setData({ ...settings, secretaryHours })}
        />
        <AdminInput label="PIX" value={settings.pixKey} onChange={(pixKey) => query.setData({ ...settings, pixKey })} />
        <AdminTextarea
          label="Dados bancários"
          value={settings.bankDetails}
          onChange={(bankDetails) => query.setData({ ...settings, bankDetails })}
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </form>
    </div>
  )
}
