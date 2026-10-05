import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { feastDescriptionLines, feastForSave, normalizeFeast, storedMediaPath } from '../src/services/feast.ts'

describe('festa da padroeira', () => {
  it('monta uma festa vazia quando o banco não tem o campo', () => {
    const feast = normalizeFeast(null)
    assert.equal(feast.enabled, false)
    assert.deepEqual(feast.program, [])
    assert.equal(feast.image, '')
  })

  it('guarda a imagem como caminho de upload e mantém a programação', () => {
    const feast = normalizeFeast({
      enabled: true,
      title: 'Festa de Nossa Senhora das Graças',
      dateLabel: '27 de novembro',
      description: 'Celebração da padroeira',
      image: 'http://localhost:3333/uploads/general/padroeira.jpg',
      program: [{ time: '19h', title: 'Missa solene' }],
    })
    assert.equal(feast.image, '/uploads/general/padroeira.jpg')
    assert.equal(feast.program[0]?.title, 'Missa solene')
    assert.equal(feast.program[0]?.type, 'evento')
    assert.equal(storedMediaPath(feast.image), '/uploads/general/padroeira.jpg')
  })

  it('prepara o payload de salvamento sem o domínio da API', () => {
    const payload = feastForSave({
      enabled: true,
      title: 'Festa',
      dateLabel: '27 de novembro',
      description: 'Texto',
      image: 'https://paroquia.test/uploads/festa.png',
      program: [],
    })
    assert.equal(payload.image, '/uploads/festa.png')
    assert.equal(payload.enabled, true)
  })

  it('conserva as quebras de linha cadastradas na descrição', () => {
    const lines = feastDescriptionLines(
      'Com grande alegria convidamos a comunidade.\n\nSerão dias de fé e oração.\nFique atento.',
    )
    assert.deepEqual(lines, [
      'Com grande alegria convidamos a comunidade.',
      '',
      'Serão dias de fé e oração.',
      'Fique atento.',
    ])
  })
})
