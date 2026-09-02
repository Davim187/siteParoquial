import { useEffect, useState, type FormEvent } from 'react'
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
import { useToast } from '@/components/ui/Toast'
import { uploadMedia } from '@/services/mediaService'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  useAdminSettingsQuery,
  useFeastQuery,
  useInvalidateQueries,
  useMessagesQuery,
  usePrayerRequestsQuery,
} from '@/hooks/queries/useAdminQueries'
import { usePastoralsQuery, usePeopleQuery, useSacramentsQuery } from '@/hooks/queries/usePublicQueries'
import { deletePastoral, savePastoral } from '@/services/pastoralService'
import { deleteSacrament, saveSacrament } from '@/services/sacramentService'
import { deletePerson, savePerson } from '@/services/parishService'
import { deletePrayerRequest, updatePrayerStatus } from '@/services/prayerService'
import { deleteMessage, updateMessageStatus } from '@/services/contactService'
import { saveFeast, saveSettings } from '@/services/parishService'
import type { ContactMessage, Pastoral, Person, Sacrament } from '@/types'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { messageStatusLabels } from '@/utils/labels'
import { formatDateTime } from '@/utils/dates'

type PastoralForm = Omit<Pastoral, 'id' | 'slug'> & {
  id?: string
  slug?: string
  imageId?: string | null
}

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
  const toast = useToast()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePastoralsQuery({ includeInactive: true })
  const [editing, setEditing] = useState<PastoralForm | null>(null)
  const [toDelete, setToDelete] = useState<Pastoral | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  return (
    <AdminCrudShell
      title="Pastorais"
      onCreate={() =>
        setEditing({
          name: '',
          description: '',
          image: '',
          imageId: null,
          responsible: '[RESPONSÁVEL]',
          contact: '[CONTATO]',
          meetingTime: '[HORÁRIO]',
          location: '[LOCAL]',
          active: true,
        })
      }
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Ativa', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          item.active ? 'Sim' : 'Não',
          <RowActions
            key={item.id}
            entityLabel="pastoral"
            onEdit={() =>
              setEditing({
                ...item,
                imageId: (item as PastoralForm).imageId ?? null,
              })
            }
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
          invalidate.pastorals()
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
              invalidate.pastorals()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminTextarea
              label="Descrição"
              value={editing.description}
              onChange={(description) => setEditing({ ...editing, description })}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Imagem</p>
              <div className="flex flex-wrap items-center gap-3">
                {editing.image ? (
                  <img src={editing.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
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
                          const media = await uploadMedia(file, 'pastorals')
                          setEditing((current) =>
                            current ? { ...current, image: media.url, imageId: media.id } : null,
                          )
                          toast.push('Imagem enviada com sucesso.')
                        } catch (uploadError) {
                          toast.push(
                            uploadError instanceof Error ? uploadError.message : 'Falha ao enviar imagem',
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
                  {editing.image ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing({ ...editing, image: '', imageId: null })}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
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
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          setEditing({ ...editing, image: media.url, imageId: media.id })
          setPickerOpen(false)
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminSacramentsPage() {
  usePageMeta('Sacramentos | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useSacramentsQuery()
  const [editing, setEditing] = useState<(Omit<Sacrament, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Sacrament | null>(null)

  return (
    <AdminCrudShell
      title="Sacramentos"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Ações']}
        rows={data?.map((item) => [
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
          invalidate.sacraments()
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
              invalidate.sacraments()
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

export function AdminPeoplePage() {
  usePageMeta('Pessoas | Admin')
  const toast = useToast()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePeopleQuery()
  const [editing, setEditing] = useState<(Omit<Person, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Person | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const usesPhotoUpload = editing?.type === 'padre' || editing?.type === 'diacono'

  return (
    <AdminCrudShell
      title="Pessoas"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Função', 'Ações']}
        rows={data?.map((item) => [
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
          invalidate.people()
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
              invalidate.people()
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
                            setEditing((current) =>
                              current ? { ...current, photo: media.url, photoId: media.id } : null,
                            )
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
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePrayerRequestsQuery()
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)

  return (
    <AdminCrudShell
      title="Pedidos de oração"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Pedido', 'Status', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          item.request,
          item.status,
          <RowActions
            key={item.id}
            entityLabel="pedido"
            onToggle={async () => {
              await updatePrayerStatus(item.id, item.status === 'new' ? 'prayed' : 'archived')
              invalidate.prayers()
              invalidate.dashboard()
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
          invalidate.prayers()
          invalidate.dashboard()
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminMessagesPage() {
  usePageMeta('Mensagens | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useMessagesQuery()
  const [viewing, setViewing] = useState<ContactMessage | null>(null)
  const [toDelete, setToDelete] = useState<{ id: string; subject: string } | null>(null)

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
    <AdminCrudShell
      title="Mensagens"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Assunto', 'Status', 'Ações']}
        rows={data?.map((item) => [
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
                    invalidate.messages()
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
                    invalidate.messages()
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
          invalidate.messages()
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminFeastPage() {
  usePageMeta('Festa | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useFeastQuery()
  const [feast, setFeast] = useState(data)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setFeast(data)
  }, [data])

  if (isLoading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const current = feast ?? data

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Festa da Padroeira</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          await saveFeast(current)
          invalidate.feast()
          setSaving(false)
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current.enabled}
            onChange={(e) => setFeast({ ...current, enabled: e.target.checked })}
          />
          Exibir banner especial na página inicial
        </label>
        <AdminInput
          label="Título"
          value={current.title}
          onChange={(title) => setFeast({ ...current, title })}
        />
        <AdminInput
          label="Data (rótulo)"
          value={current.dateLabel}
          onChange={(dateLabel) => setFeast({ ...current, dateLabel })}
        />
        <AdminTextarea
          label="Descrição"
          value={current.description}
          onChange={(description) => setFeast({ ...current, description })}
        />
        <p className="text-sm text-muted">
          A programação detalhada pode ser ampliada futuramente. Itens atuais: {current.program.length}.
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
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useAdminSettingsQuery()
  const [settings, setSettings] = useState(data)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  if (isLoading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const current = settings ?? data

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Configurações</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          await saveSettings(current)
          invalidate.settings()
          setSaving(false)
        }}
      >
        <AdminInput label="Nome" value={current.name} onChange={(name) => setSettings({ ...current, name })} />
        <AdminInput
          label="Slogan"
          value={current.slogan}
          onChange={(slogan) => setSettings({ ...current, slogan })}
        />
        <AdminTextarea
          label="Texto de boas-vindas"
          value={current.welcomeText}
          onChange={(welcomeText) => setSettings({ ...current, welcomeText })}
        />
        <AdminInput
          label="Endereço"
          value={current.address}
          onChange={(address) => setSettings({ ...current, address })}
        />
        <AdminInput
          label="URL do mapa"
          value={current.mapsUrl}
          onChange={(mapsUrl) => setSettings({ ...current, mapsUrl })}
          hint="Link do Google Maps usado no botão Como chegar (página de contato)."
        />
        <AdminInput label="Telefone" value={current.phone} onChange={(phone) => setSettings({ ...current, phone })} />
        <AdminInput
          label="WhatsApp"
          value={current.whatsapp}
          onChange={(whatsapp) => setSettings({ ...current, whatsapp })}
        />
        <AdminInput label="E-mail" value={current.email} onChange={(email) => setSettings({ ...current, email })} />
        <AdminInput
          label="Instagram"
          value={current.instagram}
          onChange={(instagram) => setSettings({ ...current, instagram })}
        />
        <AdminInput
          label="Facebook"
          value={current.facebook}
          onChange={(facebook) => setSettings({ ...current, facebook })}
        />
        <AdminInput
          label="YouTube"
          value={current.youtube}
          onChange={(youtube) => setSettings({ ...current, youtube })}
        />
        <AdminInput
          label="Horário da secretaria"
          value={current.secretaryHours}
          onChange={(secretaryHours) => setSettings({ ...current, secretaryHours })}
        />
        <AdminInput label="PIX" value={current.pixKey} onChange={(pixKey) => setSettings({ ...current, pixKey })} />
        <AdminTextarea
          label="Dados bancários"
          value={current.bankDetails}
          onChange={(bankDetails) => setSettings({ ...current, bankDetails })}
        />
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </form>
    </div>
  )
}
