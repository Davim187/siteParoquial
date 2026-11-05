import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { BrandMark } from '@/components/layout/Logo'
import { BRAND } from '@/config/brand'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useToast } from '@/components/ui/Toast'
import { apiRequest } from '@/lib/api-client'

export function AdminForgotPasswordPage() {
  usePageMeta('Esqueci a senha')
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setResetToken(null)
    setMessage(null)
    try {
      const result = await apiRequest<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        auth: false,
        json: { email: String(form.get('email') ?? '') },
      })
      setMessage(result.message)
      setResetToken(result.resetToken ?? null)
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Não foi possível pedir a recuperação', 'error')
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
          <h1 className="mt-2 font-serif text-3xl text-navy">Esqueci a senha</h1>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">{BRAND.location}</p>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Informe o e-mail da sua conta. O link para criar outra senha vale 30 minutos.
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
        {message ? <p className="mt-4 text-sm text-navy">{message}</p> : null}
        {resetToken ? (
          <Button href={`/admin/redefinir-senha?token=${resetToken}`} className="mt-4 w-full">
            Criar nova senha
          </Button>
        ) : (
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Continuar'}
          </Button>
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
