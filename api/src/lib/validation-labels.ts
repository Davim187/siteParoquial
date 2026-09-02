const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  subtitle: 'Subtítulo',
  excerpt: 'Resumo',
  content: 'Conteúdo',
  slug: 'Slug',
  category: 'Categoria',
  categoryId: 'Categoria',
  description: 'Descrição',
  eventDate: 'Data do evento',
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  phone: 'Telefone',
  subject: 'Assunto',
  message: 'Mensagem',
  request: 'Pedido',
  location: 'Local',
  alt: 'Texto alternativo',
  coverMediaId: 'Imagem de capa',
  mediaId: 'Imagem',
  status: 'Status',
  active: 'Status',
  type: 'Tipo',
  date: 'Data',
  startsAt: 'Data de início',
  endsAt: 'Data de término',
  bio: 'Biografia',
  roleTitle: 'Função',
  responsible: 'Responsável',
}

export function fieldLabel(path: string) {
  if (!path) return 'Campo'
  const key = path.split('.').pop() ?? path
  return FIELD_LABELS[key] ?? FIELD_LABELS[path] ?? key
}
