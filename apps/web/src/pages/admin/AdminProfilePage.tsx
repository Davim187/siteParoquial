import { useEffect, useState, type FormEvent } from 'react'
import { AdminInput, FormSection } from '@/components/admin/AdminUi'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { apiRequest } from '@/lib/api-client'
import { formatDateTime } from '@/utils/dates'

export function AdminProfilePage() {
  usePageMeta('Meu perfil | Admin')
  const toast = useToast()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    name: string
    email: string
    role: string
    roleName?: string
    lastLoginAt?: string | null
    avatarUrl?: string | null
    permissions: string[]
  } | null>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest<{ data: any }>('/api/me/profile')
        setProfile(res.data)
        setName(res.data.name)
        setAvatarUrl(res.data.avatarUrl ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar o perfil.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      toast.push('A confirmação de senha não confere.', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await apiRequest<{ data: any }>('/api/me/profile', {
        method: 'PATCH',
        json: {
          name,
          avatarUrl: avatarUrl || null,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
          confirmPassword: newPassword ? confirmPassword : undefined,
        },
      })
      setProfile(res.data)
      await refreshUser()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.push('Perfil atualizado.')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Erro ao salvar perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (error || !profile) return <ErrorState message={error ?? 'Erro'} />

  const initials = (profile.name || 'A')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-marian text-xl font-semibold text-white">
            {initials}
          </span>
        )}
        <div>
          <h2 className="font-serif text-2xl text-navy">{profile.name}</h2>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status="info" label={profile.roleName ?? profile.role} />
            {user?.role === 'ADMIN' ? <StatusBadge status="published" label="Acesso total" /> : null}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Último acesso:{' '}
            {profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : '—'}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSave}>
        <FormSection title="Dados pessoais">
          <AdminInput label="Nome" value={name} onChange={setName} required />
          <AdminInput
            label="E-mail"
            value={profile.email}
            onChange={() => undefined}
            hint="O e-mail não pode ser alterado aqui. Peça a um administrador se necessário."
          />
          <AdminInput
            label="URL do avatar"
            value={avatarUrl}
            onChange={setAvatarUrl}
            hint="Opcional. Cole a URL de uma imagem."
          />
        </FormSection>

        <FormSection title="Alterar senha">
          <AdminInput
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <AdminInput
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <AdminInput
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </FormSection>

        <FormSection title="Permissões efetivas">
          <ul className="grid gap-2 sm:grid-cols-2">
            {(profile.permissions ?? []).map((code) => (
              <li key={code} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {code}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">
            Você não pode alterar o próprio perfil para Administrador por esta tela.
          </p>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
