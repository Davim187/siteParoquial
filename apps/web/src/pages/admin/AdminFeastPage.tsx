import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AdminInput, AdminTextarea } from '@/components/admin/AdminUi'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { useToast } from '@/components/ui/Toast'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useFeastQuery } from '@/hooks/queries/useAdminQueries'
import { saveFeast } from '@/services/parishService'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { getErrorMessage } from '@/lib/api-error'
import { mediaUrl } from '@/lib/api-client'
import { uploadMedia } from '@/services/mediaService'
import type { FeastProgramItem, PatronFeast } from '@/types'

const PROGRAM_TYPES: Array<{ value: FeastProgramItem['type']; label: string }> = [
  { value: 'novena', label: 'Novena' },
  { value: 'missa', label: 'Missa' },
  { value: 'procissao', label: 'Procissão' },
  { value: 'evento', label: 'Evento' },
  { value: 'show', label: 'Show' },
  { value: 'quermesse', label: 'Quermesse' },
]

function newProgramItem(): FeastProgramItem {
  return {
    id: crypto.randomUUID(),
    date: '',
    time: '',
    title: '',
    description: '',
    type: 'missa',
  }
}

export function AdminFeastPage() {
  usePageMeta('Festa | Admin')
  const toast = useToast()
  const { data, isLoading, error } = useFeastQuery()
  const [feast, setFeast] = useState<PatronFeast | undefined>(data)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (data) setFeast(data)
  }, [data])

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 max-w-2xl" />
      </div>
    )
  }
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const current = feast ?? data

  function patch(next: Partial<PatronFeast>) {
    setFeast({ ...current, ...next })
  }

  function patchProgram(id: string, next: Partial<FeastProgramItem>) {
    patch({
      program: current.program.map((item) => (item.id === id ? { ...item, ...next } : item)),
    })
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Festa da Padroeira</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaving(true)
          try {
            const saved = await saveFeast(current)
            setFeast(saved)
            toast.push('Festa da Padroeira salva.')
          } catch (err) {
            toast.push(getErrorMessage(err, 'Não foi possível salvar a festa.'), 'error')
          } finally {
            setSaving(false)
          }
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current.enabled}
            onChange={(event) => patch({ enabled: event.target.checked })}
          />
          Exibir banner especial na página inicial
        </label>
        <AdminInput label="Título" value={current.title} onChange={(title) => patch({ title })} />
        <AdminInput
          label="Data (rótulo)"
          value={current.dateLabel}
          onChange={(dateLabel) => patch({ dateLabel })}
        />
        <AdminTextarea
          label="Descrição"
          value={current.description}
          onChange={(description) => patch({ description })}
          hint="Cada Enter vira uma linha nova no site. Uma linha em branco separa os parágrafos."
          rows={8}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Imagem do banner</p>
          <div className="flex flex-wrap items-center gap-3">
            {current.image ? (
              <img src={mediaUrl(current.image)} alt="" className="h-28 w-24 rounded-lg border object-cover" />
            ) : null}
            <label className="inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-sm">
              {uploading ? 'Enviando...' : 'Enviar imagem'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.nef"
                className="sr-only"
                disabled={uploading}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  setUploading(true)
                  try {
                    const media = await uploadMedia(file, 'general')
                    patch({ image: media.url })
                  } catch (err) {
                    toast.push(getErrorMessage(err, 'Falha ao enviar imagem.'), 'error')
                  } finally {
                    setUploading(false)
                  }
                }}
              />
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              Biblioteca
            </Button>
            {current.image ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => patch({ image: '' })}>
                Remover
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Programação</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => patch({ program: [...current.program, newProgramItem()] })}
            >
              Adicionar item
            </Button>
          </div>
          {current.program.length === 0 ? (
            <p className="text-sm text-muted">Nenhum item na programação.</p>
          ) : (
            current.program.map((item, index) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    Item {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => patch({ program: current.program.filter((entry) => entry.id !== item.id) })}
                  >
                    Remover
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <AdminInput
                    label="Data"
                    type="date"
                    value={item.date}
                    onChange={(date) => patchProgram(item.id, { date })}
                  />
                  <AdminInput
                    label="Horário"
                    value={item.time}
                    onChange={(time) => patchProgram(item.id, { time })}
                  />
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-700">Tipo</span>
                    <select
                      value={item.type}
                      onChange={(event) =>
                        patchProgram(item.id, { type: event.target.value as FeastProgramItem['type'] })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none focus:border-marian/40 focus:ring-2 focus:ring-marian/20"
                    >
                      {PROGRAM_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <AdminInput
                  label="Título"
                  value={item.title}
                  onChange={(title) => patchProgram(item.id, { title })}
                />
                <AdminTextarea
                  label="Descrição"
                  value={item.description}
                  onChange={(description) => patchProgram(item.id, { description })}
                />
              </div>
            ))
          )}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          patch({ image: media.url })
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
