import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AdminInput, AdminTextarea } from '@/components/admin/AdminUi'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { useToast } from '@/components/ui/Toast'
import { uploadMedia } from '@/services/mediaService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useAdminSettingsQuery, useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { saveSettings } from '@/services/parishService'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { mediaUrl } from '@/lib/api-client'

export function AdminSettingsPage() {
  usePageMeta('Configurações | Admin')
  const toast = useToast()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useAdminSettingsQuery()
  const [settings, setSettings] = useState(data)
  const [saving, setSaving] = useState(false)
  const [uploadingPatroness, setUploadingPatroness] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 max-w-2xl" />
      </div>
    )
  }
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const current = settings ?? data
  const patroness = current.patroness ?? {
    name: '',
    history: '',
    devotion: '',
    medal: '',
    feast: '',
    traditions: '',
    image: '',
  }

  function updatePatroness(patch: Partial<typeof patroness>) {
    setSettings((prev) => {
      if (!prev) return prev
      const currentPatroness = prev.patroness ?? patroness
      return { ...prev, patroness: { ...currentPatroness, ...patch } }
    })
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Configurações</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          try {
            await saveSettings(current)
            invalidate.settings()
            try {
              sessionStorage.removeItem('paroquia.home.v2')
              sessionStorage.removeItem('paroquia.home.v3')
              sessionStorage.removeItem('paroquia.home.v4')
            } catch {
              /* ignore */
            }
            toast.push('Configurações salvas.')
          } catch (err) {
            toast.push(err instanceof Error ? err.message : 'Não foi possível salvar.', 'error')
          } finally {
            setSaving(false)
          }
        }}
      >
        <p className="text-sm font-semibold text-navy">Dados gerais</p>
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
          hint="Cole o link do Google Maps ou só a URL de incorporar (src do iframe). Não cole o código HTML inteiro."
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

        <hr className="my-2 border-line" />
        <p className="text-sm font-semibold text-navy">Nossa Paróquia</p>
        <AdminTextarea
          label="História"
          value={current.history}
          onChange={(history) => setSettings({ ...current, history })}
        />
        <AdminTextarea
          label="Missão"
          value={current.mission}
          onChange={(mission) => setSettings({ ...current, mission })}
        />
        <AdminTextarea
          label="Visão"
          value={current.vision}
          onChange={(vision) => setSettings({ ...current, vision })}
        />

        <hr className="my-2 border-line" />
        <p className="text-sm font-semibold text-navy">Padroeira</p>
        <AdminInput
          label="Nome"
          value={patroness.name}
          onChange={(name) => updatePatroness({ name })}
        />
        <AdminTextarea
          label="História"
          value={patroness.history}
          onChange={(history) => updatePatroness({ history })}
        />
        <AdminTextarea
          label="Devoção"
          value={patroness.devotion}
          onChange={(devotion) => updatePatroness({ devotion })}
        />
        <AdminTextarea
          label="Medalha milagrosa"
          value={patroness.medal}
          onChange={(medal) => updatePatroness({ medal })}
        />
        <AdminTextarea
          label="Festa da padroeira"
          value={patroness.feast}
          onChange={(feast) => updatePatroness({ feast })}
        />
        <AdminTextarea
          label="Tradições"
          value={patroness.traditions}
          onChange={(traditions) => updatePatroness({ traditions })}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Imagem da padroeira</p>
          <div className="flex flex-wrap items-center gap-3">
            {patroness.image ? (
              <img src={mediaUrl(patroness.image)} alt="" className="h-24 w-20 rounded-lg border object-cover" />
            ) : null}
            <label className="inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-sm">
              {uploadingPatroness ? 'Enviando...' : 'Enviar imagem'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className="hidden"
                disabled={uploadingPatroness}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  setUploadingPatroness(true)
                  try {
                    const media = await uploadMedia(file, 'general')
                    updatePatroness({ image: media.url })
                  } catch (err) {
                    toast.push(err instanceof Error ? err.message : 'Falha ao enviar imagem.', 'error')
                  } finally {
                    setUploadingPatroness(false)
                  }
                }}
              />
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              Biblioteca
            </Button>
            {patroness.image ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => updatePatroness({ image: '' })}>
                Remover
              </Button>
            ) : null}
          </div>
        </div>

        <Button type="submit" loading={saving} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </form>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          updatePatroness({ image: media.url })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
