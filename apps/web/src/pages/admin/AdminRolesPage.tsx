import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Eye, Pencil, ShieldPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AdminInput,
  AdminTable,
  AdminTextarea,
  FormSection,
} from '@/components/admin/AdminUi'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { PERMISSION_GROUPS, slugifyRoleCode } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { apiRequest } from '@/lib/api-client'
import { IconButton } from '@/components/ui/IconButton'

type RoleRow = {
  id: string
  code: string
  name: string
  description?: string | null
  permissions: string[]
  permissionDetails?: Array<{ code: string; name: string }>
  userCount: number
  isSystem?: boolean
}

type PermissionItem = { id: string; code: string; name: string }

const emptyForm = {
  code: '',
  name: '',
  description: '',
  permissions: [] as string[],
}

export function AdminRolesPage() {
  usePageMeta('Perfis | Admin')
  const toast = useToast()
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [viewRole, setViewRole] = useState<RoleRow | null>(null)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [toDelete, setToDelete] = useState<RoleRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [codeTouched, setCodeTouched] = useState(false)

  async function load() {
    try {
      setError(null)
      const [rolesRes, permsRes] = await Promise.all([
        apiRequest<{ data: RoleRow[] }>('/api/roles'),
        apiRequest<{ data: PermissionItem[] }>('/api/permissions'),
      ])
      setRoles(rolesRes.data)
      setPermissions(permsRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar perfis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const permissionMap = useMemo(
    () => new Map(permissions.map((item) => [item.code, item.name])),
    [permissions],
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setCodeTouched(false)
    setFormOpen(true)
  }

  function openEdit(role: RoleRow) {
    setEditing(role)
    setForm({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      permissions: [...role.permissions],
    })
    setCodeTouched(true)
    setFormOpen(true)
  }

  function togglePermission(code: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((item) => item !== code)
        : [...prev.permissions, code],
    }))
  }

  function toggleGroup(codes: string[]) {
    setForm((prev) => {
      const allSelected = codes.every((code) => prev.permissions.includes(code))
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((code) => !codes.includes(code)),
        }
      }
      return {
        ...prev,
        permissions: [...new Set([...prev.permissions, ...codes])],
      }
    })
  }

  async function onSaveRole(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await apiRequest(`/api/roles/${editing.code}`, {
          method: 'PUT',
          json: {
            name: form.name,
            description: form.description || null,
            permissions: editing.isSystem ? undefined : form.permissions,
          },
        })
        toast.push('Perfil atualizado.')
      } else {
        await apiRequest('/api/roles', {
          method: 'POST',
          json: {
            code: form.code,
            name: form.name,
            description: form.description || undefined,
            permissions: form.permissions,
          },
        })
        toast.push('Perfil criado.')
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Erro ao salvar perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission('USERS_MANAGE')) {
    return <ErrorState message="Você não tem permissão para gerenciar perfis." />
  }
  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Cadastre perfis de acesso e defina o que cada um pode fazer no painel.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Usuários herdam as permissões do perfil. Você também pode ajustar permissões individuais em{' '}
            <Link to="/admin/usuarios" className="font-medium text-marian hover:underline">
              Usuários
            </Link>
            .
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <ShieldPlus size={16} /> Novo perfil
        </Button>
      </div>

      <AdminTable
        headers={['Perfil', 'Código', 'Usuários', 'Permissões', 'Ações']}
        rows={roles.map((role) => [
          <div key={`${role.id}-name`} className="text-left">
            <p className="font-medium text-slate-800">{role.name}</p>
            {role.description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{role.description}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Sem descrição</p>
            )}
          </div>,
          <code key={`${role.id}-code`} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {role.code}
          </code>,
          role.userCount,
          role.isSystem ? (
            <StatusBadge key={`${role.id}-perms`} status="published" label="Acesso total" />
          ) : (
            <span key={`${role.id}-perms`} className="text-slate-600">
              {role.permissions.length} permissões
            </span>
          ),
          <div key={`${role.id}-actions`} className="flex items-center justify-center gap-0.5">
            <IconButton label="Ver permissões" showTooltip={false} onClick={() => setViewRole(role)}>
              <Eye size={16} />
            </IconButton>
            <IconButton label="Editar perfil" tone="primary" showTooltip={false} onClick={() => openEdit(role)}>
              <Pencil size={16} />
            </IconButton>
            {!role.isSystem ? (
              <IconButton
                label="Excluir perfil"
                tone="dangerSolid"
                showTooltip={false}
                onClick={() => setToDelete(role)}
              >
                <Trash2 size={16} />
              </IconButton>
            ) : null}
          </div>,
        ])}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar perfil · ${editing.name}` : 'Novo perfil'}
      >
        <form className="space-y-4" onSubmit={onSaveRole}>
          <FormSection title="Informações do perfil">
            {!editing ? (
              <AdminInput
                label="Código interno"
                value={form.code}
                onChange={(code) => {
                  setCodeTouched(true)
                  setForm((prev) => ({ ...prev, code: code.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))
                }}
                required
                hint="Identificador único. Ex.: COORDENADOR, CATEQUISTA"
              />
            ) : (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">Código interno</span>
                <input
                  value={form.code}
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-500"
                />
              </label>
            )}
            <AdminInput
              label="Nome do perfil"
              value={form.name}
              onChange={(name) => {
                setForm((prev) => ({
                  ...prev,
                  name,
                  code: !editing && !codeTouched ? slugifyRoleCode(name) : prev.code,
                }))
              }}
              required
            />
            <AdminTextarea
              label="Descrição"
              value={form.description}
              onChange={(description) => setForm((prev) => ({ ...prev, description }))}
              hint="Opcional. Explique para que serve este perfil."
            />
          </FormSection>

          {editing?.isSystem ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              O perfil <strong>Administrador</strong> possui acesso total ao sistema e não pode ter permissões
              alteradas.
            </p>
          ) : (
            <FormSection title="Permissões do perfil">
              <p className="text-sm text-slate-500">
                Marque o que usuários com este perfil poderão fazer no painel.
              </p>
              <div className="space-y-5">
                {PERMISSION_GROUPS.map((group) => {
                  const groupCodes = group.codes.filter((code) => permissionMap.has(code))
                  if (groupCodes.length === 0) return null
                  const allSelected = groupCodes.every((code) => form.permissions.includes(code))
                  return (
                    <div key={group.title}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="font-serif text-lg text-navy">{group.title}</h3>
                        <button
                          type="button"
                          className="text-xs font-medium text-marian hover:underline"
                          onClick={() => toggleGroup(groupCodes)}
                        >
                          {allSelected ? 'Desmarcar grupo' : 'Marcar grupo'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {groupCodes.map((code) => {
                          const perm = permissions.find((item) => item.code === code)
                          if (!perm) return null
                          return (
                            <label
                              key={code}
                              className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={form.permissions.includes(code)}
                                onChange={() => togglePermission(code)}
                              />
                              <span>
                                <span className="block font-medium text-slate-800">{perm.name}</span>
                                <span className="text-xs text-slate-400">{code}</span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </FormSection>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Salvar perfil' : 'Criar perfil'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(viewRole)} onClose={() => setViewRole(null)} title={`Permissões · ${viewRole?.name ?? ''}`}>
        {viewRole ? (
          <div className="space-y-4">
            {viewRole.description ? (
              <p className="text-sm text-slate-600">{viewRole.description}</p>
            ) : null}
            <p className="text-xs text-slate-400">
              Código: <code>{viewRole.code}</code> · {viewRole.userCount} usuário(s)
            </p>
            {viewRole.isSystem ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Este perfil possui <strong>acesso total</strong> a todas as áreas do painel.
              </p>
            ) : viewRole.permissions.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma permissão configurada.</p>
            ) : (
              <div className="space-y-5">
                {PERMISSION_GROUPS.map((group) => {
                  const items = group.codes
                    .filter((code) => viewRole.permissions.includes(code))
                    .map((code) => ({
                      code,
                      name: permissionMap.get(code) ?? code,
                    }))
                  if (items.length === 0) return null
                  return (
                    <div key={group.title}>
                      <h3 className="mb-2 font-serif text-lg text-navy">{group.title}</h3>
                      <ul className="space-y-1.5">
                        {items.map((item) => (
                          <li
                            key={item.code}
                            className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="mt-0.5 block text-xs text-slate-400">{item.code}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewRole(null)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir perfil?"
        description={
          toDelete?.userCount
            ? `O perfil "${toDelete.name}" possui ${toDelete.userCount} usuário(s) vinculado(s) e não pode ser excluído.`
            : `Você está prestes a excluir o perfil "${toDelete?.name ?? ''}". Essa ação não poderá ser desfeita.`
        }
        confirmLabel="Excluir"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete || toDelete.userCount > 0) {
            setToDelete(null)
            return
          }
          setSaving(true)
          try {
            await apiRequest(`/api/roles/${toDelete.code}`, { method: 'DELETE' })
            toast.push('Perfil excluído.')
            setToDelete(null)
            await load()
          } catch (err) {
            toast.push(err instanceof Error ? err.message : 'Erro ao excluir perfil.', 'error')
          } finally {
            setSaving(false)
          }
        }}
        loading={saving}
      />
    </div>
  )
}
