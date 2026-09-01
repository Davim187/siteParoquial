import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { KeyRound, Shield, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AdminInput,
  AdminTable,
  FormSection,
  RowActions,
} from '@/components/admin/AdminUi'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { PERMISSION_GROUPS } from '@/constants/permissions'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { apiRequest } from '@/lib/api-client'
import { IconButton } from '@/components/ui/IconButton'
import { formatDateTime } from '@/utils/dates'

type UserRow = {
  id: string
  name: string
  email: string
  active: boolean
  role: string
  roleName?: string
  lastLoginAt?: string | null
  overrides?: Array<{ code: string; granted: boolean }>
}

type PermissionItem = { id: string; code: string; name: string }

type RoleOption = {
  code: string
  name: string
  permissions: string[]
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'EDITOR',
  active: true,
}

export function AdminUsersPage() {
  usePageMeta('Usuários | Admin')
  const toast = useToast()
  const { hasPermission, user: me } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [permUser, setPermUser] = useState<UserRow | null>(null)
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({})
  const [toDelete, setToDelete] = useState<UserRow | null>(null)
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null)
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  async function load() {
    try {
      setError(null)
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        apiRequest<{ data: UserRow[] }>('/api/users'),
        apiRequest<{ data: RoleOption[] }>('/api/roles'),
        apiRequest<{ data: PermissionItem[] }>('/api/permissions'),
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
      setPermissions(permsRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? user.active : !user.active)
      return matchesSearch && matchesStatus
    })
  }, [users, search, statusFilter])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(user: UserRow) {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      active: user.active,
    })
    setFormOpen(true)
  }

  function openPermissions(user: UserRow) {
    const rolePerms = new Set(roles.find((role) => role.code === user.role)?.permissions ?? [])
    const map: Record<string, boolean | null> = {}
    for (const perm of permissions) {
      const override = user.overrides?.find((item) => item.code === perm.code)
      if (override) map[perm.code] = override.granted
      else map[perm.code] = null
    }
    // seed checked state for UI: effective = role + overrides
    setOverrides(map)
    setPermUser({ ...user, overrides: user.overrides ?? [] })
    void rolePerms
  }

  function isChecked(code: string) {
    if (!permUser) return false
    const roleHas = roles.find((role) => role.code === permUser.role)?.permissions.includes(code)
    const override = overrides[code]
    if (override === true) return true
    if (override === false) return false
    return Boolean(roleHas)
  }

  function togglePermission(code: string) {
    if (!permUser) return
    const roleHas = Boolean(roles.find((role) => role.code === permUser.role)?.permissions.includes(code))
    const currently = isChecked(code)
    const next = !currently
    setOverrides((prev) => {
      const copy = { ...prev }
      if (next === roleHas) copy[code] = null
      else copy[code] = next
      return copy
    })
  }

  async function onSaveUser(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await apiRequest(`/api/users/${editing.id}`, {
          method: 'PUT',
          json: {
            name: form.name,
            email: form.email,
            role: form.role,
            active: form.active,
          },
        })
        toast.push('Usuário atualizado.')
      } else {
        if (form.password !== form.confirmPassword) {
          toast.push('A confirmação de senha não confere.', 'error')
          return
        }
        await apiRequest('/api/users', {
          method: 'POST',
          json: form,
        })
        toast.push('Usuário criado.')
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Erro ao salvar usuário.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onSavePermissions() {
    if (!permUser) return
    setSaving(true)
    try {
      const payload = Object.entries(overrides)
        .filter(([, value]) => value !== null)
        .map(([code, granted]) => ({ code, granted: Boolean(granted) }))
      await apiRequest(`/api/users/${permUser.id}/permissions`, {
        method: 'PUT',
        json: { overrides: payload },
      })
      toast.push('Permissões atualizadas.')
      setPermUser(null)
      await load()
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Erro ao salvar permissões.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onResetPassword(event: FormEvent) {
    event.preventDefault()
    if (!passwordUser) return
    setSaving(true)
    try {
      await apiRequest(`/api/users/${passwordUser.id}/password`, {
        method: 'PATCH',
        json: passwordForm,
      })
      toast.push('Senha redefinida.')
      setPasswordUser(null)
      setPasswordForm({ password: '', confirmPassword: '' })
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Erro ao redefinir senha.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission('USERS_MANAGE')) {
    return <ErrorState message="Você não tem permissão para gerenciar usuários." />
  }
  if (loading) return <Loading />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Gerencie contas, perfis e permissões do painel.</p>
          <p className="mt-1 text-xs text-slate-400">
            Para cadastrar perfis ou ver permissões de cada um, acesse{' '}
            <Link to="/admin/perfis" className="font-medium text-marian hover:underline">
              Perfis de acesso
            </Link>
            .
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <UserPlus size={16} /> Novo usuário
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar usuários..."
          className="min-w-[14rem] flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-marian/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSearch('')
            setStatusFilter('all')
          }}
        >
          Limpar filtros
        </Button>
      </div>

      <p className="text-sm text-slate-400">
        Mostrando {filtered.length} de {users.length} usuários
      </p>

      <AdminTable
        headers={['Nome', 'E-mail', 'Perfil', 'Status', 'Último acesso', 'Ações']}
        rows={filtered.map((user) => [
          <div key={`${user.id}-name`} className="font-medium text-slate-800">
            {user.name}
            {user.id === me?.id ? (
              <span className="ml-2 text-xs font-normal text-slate-400">(você)</span>
            ) : null}
          </div>,
          user.email,
          user.roleName ?? user.role,
          <StatusBadge key={`${user.id}-status`} status={user.active ? 'active' : 'inactive'} />,
          user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca',
          <div key={`${user.id}-actions`} className="flex items-center justify-center gap-0.5">
            <RowActions
              entityLabel="usuário"
              onEdit={() => openEdit(user)}
              onDelete={user.id === me?.id ? undefined : () => setToDelete(user)}
            />
            {user.role !== 'ADMIN' ? (
            <IconButton
              label="Permissões do usuário"
              showTooltip={false}
              onClick={() => openPermissions(user)}
            >
              <Shield size={16} />
            </IconButton>
            ) : null}
            <IconButton
              label="Redefinir senha"
              showTooltip={false}
              onClick={() => setPasswordUser(user)}
            >
              <KeyRound size={16} />
            </IconButton>
          </div>,
        ])}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
      >
        <form className="space-y-4" onSubmit={onSaveUser}>
          <FormSection title="Informações básicas">
            <AdminInput
              label="Nome completo"
              value={form.name}
              onChange={(name) => setForm((prev) => ({ ...prev, name }))}
              required
            />
            <AdminInput
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(email) => setForm((prev) => ({ ...prev, email }))}
              required
            />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Perfil</span>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5"
              >
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Usuário ativo
            </label>
          </FormSection>
          {!editing ? (
            <FormSection title="Senha">
              <AdminInput
                label="Senha"
                type="password"
                value={form.password}
                onChange={(password) => setForm((prev) => ({ ...prev, password }))}
                required
                hint="Mínimo de 8 caracteres."
              />
              <AdminInput
                label="Confirmar senha"
                type="password"
                value={form.confirmPassword}
                onChange={(confirmPassword) => setForm((prev) => ({ ...prev, confirmPassword }))}
                required
              />
            </FormSection>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Salvar' : 'Criar usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(permUser)}
        onClose={() => setPermUser(null)}
        title={`Permissões · ${permUser?.name ?? ''}`}
      >
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          <p className="text-sm text-slate-500">
            Perfil base: <strong>{permUser?.role}</strong>. Marque ou desmarque permissões específicas.
          </p>
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 font-serif text-lg text-navy">{group.title}</h3>
              <div className="space-y-2">
                {group.codes.map((code) => {
                  const perm = permissions.find((item) => item.code === code)
                  if (!perm) return null
                  const overridden = overrides[code] !== null && overrides[code] !== undefined
                  return (
                    <label
                      key={code}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={isChecked(code)}
                        onChange={() => togglePermission(code)}
                      />
                      <span>
                        <span className="block font-medium text-slate-800">{perm.name}</span>
                        <span className="text-xs text-slate-400">
                          {code}
                          {overridden ? ' · override' : ''}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPermUser(null)}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={() => void onSavePermissions()}>
            Salvar permissões
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(passwordUser)}
        onClose={() => setPasswordUser(null)}
        title={`Redefinir senha · ${passwordUser?.name ?? ''}`}
      >
        <form className="space-y-4" onSubmit={onResetPassword}>
          <AdminInput
            label="Nova senha"
            type="password"
            value={passwordForm.password}
            onChange={(password) => setPasswordForm((prev) => ({ ...prev, password }))}
            required
          />
          <AdminInput
            label="Confirmar senha"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(confirmPassword) => setPasswordForm((prev) => ({ ...prev, confirmPassword }))}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPasswordUser(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Redefinir
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir usuário?"
        description={`Você está prestes a excluir "${toDelete?.name ?? ''}". Essa ação não poderá ser desfeita.`}
        confirmLabel="Excluir"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          setSaving(true)
          try {
            await apiRequest(`/api/users/${toDelete.id}`, { method: 'DELETE' })
            toast.push('Usuário excluído.')
            setToDelete(null)
            await load()
          } catch (err) {
            toast.push(err instanceof Error ? err.message : 'Erro ao excluir.', 'error')
          } finally {
            setSaving(false)
          }
        }}
        loading={saving}
      />
    </div>
  )
}
