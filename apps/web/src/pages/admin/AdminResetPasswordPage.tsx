import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { BrandMark } from '@/components/layout/Logo'
import { BRAND } from '@/config/brand'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useToast } from '@/components/ui/Toast'
import { apiRequest } from '@/lib/api-client'

export function AdminResetPasswordPage() {
  usePageMeta('Nova senha')
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    try {
      const result = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        auth: false,
        json: {
          token,
          password: String(form.get('password') ?? ''),
          confirmPassword: String(form.get('confirmPassword') ?? ''),
        },
      })
      toast.push(result.message)
      navigate('/admin/login')
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Não foi possível redefinir a senha', 'error')
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
          <h1 className="mt-2 font-serif text-3xl text-navy">Nova senha</h1>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">{BRAND.location}</p>
        </div>
        {!token ? (
          <p className="mt-6 text-center text-sm text-muted">Este link não contém um código válido.</p>
        ) : (
          <>
            <p className="mt-6 text-center text-sm text-muted">Escolha uma senha com pelo menos 8 caracteres.</p>
            <label className="mt-6 block text-sm">
              <span className="mb-1 block font-medium text-navy">Nova senha *</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-line px-3 py-2.5"
              />
            </label>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium text-navy">Confirmar senha *</span>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-line px-3 py-2.5"
              />
            </label>
            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar senha'}
            </Button>
          </>
        )}
        <p className="mt-4 text-center text-sm">
          <Link to="/admin/login" className="text-marian underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  )
}
