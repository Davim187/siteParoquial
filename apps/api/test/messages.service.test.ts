import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AppError } from '../src/lib/http.js'
import { createMessageSchema, updateMessageSchema } from '../src/modules/content/messages/messages.schema.js'
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
  type MessageStore,
} from '../src/modules/content/messages/messages.service.js'

function missingRecord() {
  const error = new Error('Record to delete does not exist.') as Error & { code: string }
  error.code = 'P2022'
  return error
}

function memoryStore() {
  const rows: Array<{
    id: string
    name: string
    email: string
    phone: string | null
    subject: string
    message: string
    status: 'NEW' | 'READ' | 'REPLIED'
  }> = []
  let seq = 0

  const store: MessageStore = {
    async createMessage(data) {
      seq += 1
      const item = {
        id: `msg-${seq}`,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        subject: data.subject,
        message: data.message,
        status: 'NEW' as const,
      }
      rows.push(item)
      return item
    },
    async countMessages() {
      return rows.length
    },
    async findMessages(skip, take) {
      return rows.slice(skip, skip + take)
    },
    async updateMessage(id, data) {
      const item = rows.find((row) => row.id === id)
      if (!item) throw missingRecord()
      if (data.status) item.status = data.status
      return item
    },
    async deleteMessage(id) {
      const index = rows.findIndex((row) => row.id === id)
      if (index < 0) throw missingRecord()
      rows.splice(index, 1)
      return { id }
    },
  }

  return { rows, store }
}

const validInput = {
  name: 'Ana',
  email: 'ana@paroquia.test',
  phone: '',
  subject: 'Visita',
  message: 'Quero agendar uma visita.',
}

describe('mensagens — validação', () => {
  it('aceita uma mensagem completa', () => {
    const parsed = createMessageSchema.parse(validInput)
    assert.equal(parsed.email, 'ana@paroquia.test')
  })

  it('recusa mensagem curta, e-mail inválido e assunto vazio', () => {
    const result = createMessageSchema.safeParse({
      ...validInput,
      email: 'nao-e-email',
      subject: 'A',
      message: 'oi',
    })
    assert.equal(result.success, false)
  })

  it('aceita os status do painel e recusa valor desconhecido', () => {
    assert.equal(updateMessageSchema.parse({ status: 'READ' }).status, 'READ')
    assert.equal(updateMessageSchema.safeParse({ status: 'ARCHIVED' }).success, false)
  })
})

describe('mensagens — serviço', () => {
  it('grava a mensagem, limpa telefone vazio e devolve o id', async () => {
    const { rows, store } = memoryStore()
    const created = await createMessage(validInput, store)
    assert.equal(created.message, 'Mensagem enviada com sucesso.')
    assert.equal(created.id, 'msg-1')
    assert.equal(rows[0]?.phone, null)
  })

  it('lista com paginação', async () => {
    const { store } = memoryStore()
    await createMessage(validInput, store)
    await createMessage({ ...validInput, name: 'Bia', subject: 'Missa' }, store)
    const page = await listMessages({ page: 1, limit: 1 }, store)
    assert.equal(page.data.length, 1)
    assert.equal(page.pagination.total, 2)
    assert.equal(page.pagination.totalPages, 2)
  })

  it('atualiza o status e falha quando a mensagem não existe', async () => {
    const { store } = memoryStore()
    const created = await createMessage(validInput, store)
    const updated = await updateMessage(created.id, { status: 'READ' }, store)
    assert.equal((updated as { status: string }).status, 'READ')
    await assert.rejects(() => updateMessage('ausente', { status: 'REPLIED' }, store), (error: unknown) => {
      assert.ok(error instanceof AppError)
      assert.equal(error.statusCode, 404)
      return true
    })
  })

  it('exclui a mensagem e falha quando ela já não existe', async () => {
    const { rows, store } = memoryStore()
    const created = await createMessage(validInput, store)
    const removed = await deleteMessage(created.id, store)
    assert.deepEqual(removed, { ok: true })
    assert.equal(rows.length, 0)
    await assert.rejects(() => deleteMessage(created.id, store), (error: unknown) => {
      assert.ok(error instanceof AppError)
      assert.equal(error.statusCode, 404)
      return true
    })
  })
})
