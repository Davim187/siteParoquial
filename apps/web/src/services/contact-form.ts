export type ContactDraft = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export type MessageStatus = 'new' | 'read' | 'replied'

type ContactFormElement = {
  reset(): void
}

type ContactSubmitEvent = {
  preventDefault(): void
  currentTarget: ContactFormElement | null
}

export function readContactDraft(form: FormData): ContactDraft {
  return {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    phone: String(form.get('phone') ?? ''),
    subject: String(form.get('subject') ?? ''),
    message: String(form.get('message') ?? ''),
  }
}

export function mapMessageStatus(status: string): MessageStatus {
  if (status === 'NEW') return 'new'
  if (status === 'READ') return 'read'
  return 'replied'
}

export function deleteMessageRequest(id: string) {
  return { path: `/api/messages/${id}`, method: 'DELETE' as const }
}

export function updateMessageRequest(id: string, status: MessageStatus) {
  const map = { new: 'NEW', read: 'READ', replied: 'REPLIED' } as const
  return {
    path: `/api/messages/${id}`,
    method: 'PATCH' as const,
    json: { status: map[status] },
  }
}

export async function submitContactAndReset(
  formElement: ContactFormElement,
  draft: ContactDraft,
  submit: (draft: ContactDraft) => Promise<unknown>,
) {
  await submit(draft)
  formElement.reset()
}

/** Guarda o formulário antes do await. Depois da resposta, currentTarget já é null. */
export async function handleContactSubmit(
  event: ContactSubmitEvent,
  readForm: (formElement: ContactFormElement) => FormData,
  submit: (draft: ContactDraft) => Promise<unknown>,
) {
  event.preventDefault()
  const formElement = event.currentTarget
  if (!formElement) {
    throw new TypeError('Formulário indisponível.')
  }
  const draft = readContactDraft(readForm(formElement))
  await submitContactAndReset(formElement, draft, submit)
}
