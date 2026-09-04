import { fieldLabel } from '@/lib/validation-labels'

export type ValidationDetail = {
  path: string
  label?: string
  message: string
}

export type ApiErrorBody = {
  error?: string
  message?: string
  details?: ValidationDetail[]
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: ValidationDetail[]

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? 'Erro na requisição.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.error
    this.details = body.details
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody
  return new ApiError(response.status, body)
}

export function getErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details?.length) return {}
  return Object.fromEntries(
    error.details.map((item) => {
      const key = item.path.split('.').pop() ?? item.path
      return [key, item.message]
    }),
  )
}

export function formatValidationSummary(error: unknown, fallback?: string): string {
  if (error instanceof ApiError && error.details?.length) {
    return error.details
      .map((item) => {
        const label = item.label ?? fieldLabel(item.path)
        return `${label}: ${item.message}`
      })
      .join('\n')
  }
  return getErrorMessage(error, fallback)
}
