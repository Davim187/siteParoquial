import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminTable,
  RowActions,
} from '@/components/admin/AdminUi'
import { AdminDeleteConfirm } from '@/components/admin/AdminDeleteConfirm'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries, useMessagesQuery } from '@/hooks/queries/useAdminQueries'
import { deleteMessage, updateMessageStatus } from '@/services/contactService'
import type { ContactMessage } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { messageStatusLabels } from '@/utils/labels'
import { formatDateTime } from '@/utils/dates'

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

      <AdminDeleteConfirm
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
