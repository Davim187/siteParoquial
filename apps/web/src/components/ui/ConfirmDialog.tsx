import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onClose,
  loading = false,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
  loading?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const isLoading = loading || busy

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={() => void handleConfirm()} loading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
