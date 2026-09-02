import { z } from 'zod'

const ptErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Este campo é obrigatório.' }
      }
      return { message: 'Valor inválido.' }
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        if (issue.minimum === 1) {
          return { message: 'Este campo é obrigatório.' }
        }
        return { message: `Deve ter pelo menos ${issue.minimum} caracteres.` }
      }
      if (issue.type === 'array') {
        return { message: `Selecione pelo menos ${issue.minimum} item(ns).` }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Deve ter no máximo ${issue.maximum} caracteres.` }
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Informe um e-mail válido.' }
      }
      if (issue.validation === 'datetime') {
        return { message: 'Informe uma data válida.' }
      }
      break
    default:
      break
  }

  return { message: ctx.defaultError }
}

z.setErrorMap(ptErrorMap)
