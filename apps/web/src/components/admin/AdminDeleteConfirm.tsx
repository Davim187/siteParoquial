import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function AdminDeleteConfirm({
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
