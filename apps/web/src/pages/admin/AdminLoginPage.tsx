import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { BrandMark } from '@/components/layout/Logo'
import { BRAND } from '@/config/brand'
import { useAuth } from '@/contexts/AuthContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useToast } from '@/components/ui/Toast'

export function AdminLoginPage() {
  usePageMeta('Entrar no painel')
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await login(String(form.get('email')), String(form.get('password')))
      toast.push('Bem-vindo ao painel.')
      navigate('/admin')
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Falha no login', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#3d6b99,_#0f2744_55%)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-cream p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <BrandMark size="lg" className="shadow-md" />
          <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-gold-dark uppercase">
            Painel paroquial
          </p>
          <h1 className="mt-2 font-serif text-3xl text-navy">{BRAND.shortName}</h1>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">{BRAND.location}</p>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Acesso restrito a colaboradores autorizados da paróquia.
        </p>
        <label className="mt-6 block text-sm">
          <span className="mb-1 block font-medium text-navy">E-mail *</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </label>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-navy">Senha *</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-line px-3 py-2.5"
          />
        </label>
        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
