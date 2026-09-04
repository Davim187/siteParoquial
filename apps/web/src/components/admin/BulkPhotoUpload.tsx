import { useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { prepareUploadImage } from '@/utils/prepareUploadImage'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
const MAX_FILE_MB = 15
const MAX_FILES = 50

export type PendingUploadFile = {
  id: string
  file: File
  previewUrl: string
  status: 'preparing' | 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

type BulkPhotoUploadProps = {
  onUpload: (files: File[]) => Promise<{ succeeded: string[]; failed: Array<{ fileName: string; error: string }> }>
  disabled?: boolean
}

function validateFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  const ext = file.name.toLowerCase()
  const validExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].some((item) => ext.endsWith(item))
  if (!allowed.includes(file.type) && !validExt) {
    return `O arquivo ${file.name} não é um formato de imagem válido.`
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `O arquivo ${file.name} excede o limite de ${MAX_FILE_MB} MB.`
  }
  return null
}

export function BulkPhotoUpload({ onUpload, disabled }: BulkPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<PendingUploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const pendingFiles = useMemo(
    () => items.filter((item) => item.status === 'pending' || item.status === 'error').map((item) => item.file),
    [items],
  )

  const preparingCount = useMemo(() => items.filter((item) => item.status === 'preparing').length, [items])

  async function handleSelect(selected: FileList | null) {
    if (!selected?.length || preparing) return
    setSummary(null)

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of Array.from(selected)) {
      if (items.length + validFiles.length >= MAX_FILES) {
        errors.push(`É possível selecionar no máximo ${MAX_FILES} fotos por vez.`)
        break
      }
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
        continue
      }
      validFiles.push(file)
    }

    if (!validFiles.length) {
      if (errors.length) setSummary(errors.join(' '))
      return
    }

    const placeholders: PendingUploadFile[] = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: '',
      status: 'preparing',
    }))

    setPreparing(true)
    setItems((current) => [...current, ...placeholders])

    for (const placeholder of placeholders) {
      try {
        const prepared = await prepareUploadImage(placeholder.file)
        const ready: PendingUploadFile = {
          id: placeholder.id,
          file: prepared,
          previewUrl: URL.createObjectURL(prepared),
          status: 'pending',
        }
        setItems((current) => current.map((item) => (item.id === placeholder.id ? ready : item)))
      } catch {
        errors.push(`Não foi possível preparar o arquivo ${placeholder.file.name}.`)
        setItems((current) => current.filter((item) => item.id !== placeholder.id))
      }
    }

    setPreparing(false)
    if (errors.length) setSummary(errors.join(' '))
  }

  function removeItem(id: string) {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return current.filter((entry) => entry.id !== id)
    })
  }

  async function handleUpload() {
    if (!pendingFiles.length || uploading) return
    setUploading(true)
    setSummary(null)
    setItems((current) =>
      current.map((item) =>
        item.status === 'pending' || item.status === 'error' ? { ...item, status: 'uploading' } : item,
      ),
    )

    try {
      const result = await onUpload(pendingFiles)
      setItems((current) =>
        current.map((item) => {
          if (item.status !== 'uploading') return item
          const failed = result.failed.find((entry) => entry.fileName === item.file.name)
          if (failed) return { ...item, status: 'error', error: failed.error }
          return { ...item, status: 'success' }
        }),
      )
      const message = [
        result.succeeded.length ? `${result.succeeded.length} foto(s) enviada(s) com sucesso.` : null,
        result.failed.length ? `${result.failed.length} foto(s) não puderam ser enviadas.` : null,
      ]
        .filter(Boolean)
        .join(' ')
      setSummary(message || 'Upload concluído.')
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.status === 'uploading'
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Falha no upload.' }
            : item,
        ),
      )
      setSummary(error instanceof Error ? error.message : 'Falha no upload.')
    } finally {
      setUploading(false)
    }
  }

  function clearSuccessful() {
    setItems((current) => {
      current.filter((item) => item.status === 'success').forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return current.filter((item) => item.status !== 'success')
    })
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-cream/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          disabled={disabled || uploading || preparing}
          onChange={(event) => {
            void handleSelect(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || uploading || preparing}
          loading={preparing}
          onClick={() => inputRef.current?.click()}
        >
          {!preparing ? <ImagePlus className="mr-2 h-4 w-4" /> : null}
          {preparing ? 'Preparando fotos...' : 'Selecionar fotos'}
        </Button>
        {pendingFiles.length ? (
          <Button type="button" size="sm" disabled={disabled || uploading || preparing} onClick={() => void handleUpload()}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Enviando...' : `Enviar ${pendingFiles.length} foto(s)`}
          </Button>
        ) : null}
        {items.some((item) => item.status === 'success') ? (
          <Button type="button" variant="secondary" size="sm" onClick={clearSuccessful}>
            Limpar enviadas
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Selecione várias imagens de uma vez (JPG, PNG, WebP ou HEIC). Máximo {MAX_FILES} arquivos, {MAX_FILE_MB} MB
        cada.
      </p>

      {preparingCount ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Preparando {preparingCount} foto(s)...
        </p>
      ) : null}

      {summary ? (
        <p className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-navy">
          {summary.includes('não puderam') || summary.includes('não é um formato') || summary.includes('Não foi possível') ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          )}
          {summary}
        </p>
      ) : null}

      {items.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item, index) => (
            <li key={item.id} className="relative overflow-hidden rounded-lg border border-line bg-white">
              {item.status === 'preparing' ? (
                <div className="flex aspect-square w-full items-center justify-center bg-cream">
                  <LoaderCircle className="h-6 w-6 animate-spin text-muted" aria-hidden="true" />
                  <span className="sr-only">Preparando foto...</span>
                </div>
              ) : (
                <img src={item.previewUrl} alt="" className="aspect-square w-full object-cover" />
              )}
              <span className="absolute top-1 left-1 rounded bg-navy-deep/70 px-1.5 py-0.5 text-[10px] text-white">
                {index + 1}
              </span>
              {item.status === 'preparing' ? (
                <span className="absolute inset-x-0 bottom-0 bg-navy-deep/80 py-1 text-center text-[10px] text-white">
                  Preparando...
                </span>
              ) : null}
              {item.status === 'uploading' ? (
                <span className="absolute inset-0 flex items-center justify-center bg-navy-deep/40 text-xs font-medium text-white">
                  Enviando...
                </span>
              ) : null}
              {item.status === 'success' ? (
                <span className="absolute inset-x-0 bottom-0 bg-emerald-600/90 py-1 text-center text-[10px] text-white">
                  Enviada
                </span>
              ) : null}
              {item.status === 'error' ? (
                <span className="absolute inset-x-0 bottom-0 bg-red-600/90 px-1 py-1 text-center text-[10px] leading-tight text-white">
                  {item.error ?? 'Erro'}
                </span>
              ) : null}
              {!uploading && !preparing && item.status !== 'success' && item.status !== 'preparing' ? (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-red-600 shadow"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
