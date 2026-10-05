import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  deleteMessageRequest,
  handleContactSubmit,
  mapMessageStatus,
  readContactDraft,
  updateMessageRequest,
} from '../src/services/contact-form.ts'

function draftForm() {
  const form = new FormData()
  form.set('name', 'Ana')
  form.set('email', 'ana@paroquia.test')
  form.set('phone', '85999990000')
  form.set('subject', 'Visita')
  form.set('message', 'Quero agendar uma visita.')
  return form
}

describe('formulário de contato', () => {
  it('lê os campos do formulário', () => {
    assert.deepEqual(readContactDraft(draftForm()), {
      name: 'Ana',
      email: 'ana@paroquia.test',
      phone: '85999990000',
      subject: 'Visita',
      message: 'Quero agendar uma visita.',
    })
  })

  it('reseta o formulário capturado depois do envio, mesmo com currentTarget nulo', async () => {
    let resets = 0
    const formElement = { reset() { resets += 1 } }
    let currentTarget: { reset(): void } | null = formElement
    let sentName = ''

    const event = {
      preventDefault() {},
      get currentTarget() {
        return currentTarget
      },
    }

    await handleContactSubmit(
      event,
      () => draftForm(),
      async (draft) => {
        currentTarget = null
        sentName = draft.name
      },
    )

    assert.equal(sentName, 'Ana')
    assert.equal(currentTarget, null)
    assert.equal(resets, 1)
  })

  it('não reseta o formulário quando o envio falha', async () => {
    let resets = 0
    const formElement = { reset() { resets += 1 } }

    await assert.rejects(() =>
      handleContactSubmit(
        { preventDefault() {}, currentTarget: formElement },
        () => draftForm(),
        async () => {
          throw new Error('falha de rede')
        },
      ),
    )
    assert.equal(resets, 0)
  })
})

describe('pedidos do painel de mensagens', () => {
  it('traduz o status da API', () => {
    assert.equal(mapMessageStatus('NEW'), 'new')
    assert.equal(mapMessageStatus('READ'), 'read')
    assert.equal(mapMessageStatus('REPLIED'), 'replied')
  })

  it('chama DELETE na mensagem e PATCH ao mudar o status', () => {
    assert.deepEqual(deleteMessageRequest('abc'), {
      path: '/api/messages/abc',
      method: 'DELETE',
    })
    assert.deepEqual(updateMessageRequest('abc', 'read'), {
      path: '/api/messages/abc',
      method: 'PATCH',
      json: { status: 'READ' },
    })
  })
})
