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
      if (issue.type === 'number') {
        return { message: `O valor deve ser no mínimo ${issue.minimum}.` }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Deve ter no máximo ${issue.maximum} caracteres.` }
      }
      if (issue.type === 'array') {
        return { message: `Selecione no máximo ${issue.maximum} item(ns).` }
      }
      if (issue.type === 'number') {
        return { message: `O valor deve ser no máximo ${issue.maximum}.` }
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Informe um e-mail válido.' }
      }
      if (issue.validation === 'url') {
        return { message: 'Informe uma URL válida.' }
      }
      if (issue.validation === 'uuid' || issue.validation === 'cuid') {
        return { message: 'Identificador inválido.' }
      }
      if (issue.validation === 'datetime') {
        return { message: 'Informe uma data válida.' }
      }
      if (issue.validation === 'regex') {
        return { message: 'Formato inválido.' }
      }
      break
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Valor inválido.' }
    case z.ZodIssueCode.invalid_date:
      return { message: 'Informe uma data válida.' }
    default:
      break
  }

  return { message: ctx.defaultError }
}

z.setErrorMap(ptErrorMap)
