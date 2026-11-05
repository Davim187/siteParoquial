import type {
  ContactMessage,
  EventCategory,
  GalleryCategory,
  NoticeCategory,
  PastoralKind,
  PrayerRequest,
} from '@/types'

export const pastoralKindLabels: Record<PastoralKind, { singular: string; plural: string }> = {
  pastoral: { singular: 'Pastoral', plural: 'Pastorais' },
  movimento: { singular: 'Movimento', plural: 'Movimentos' },
  comissao: { singular: 'Comissão', plural: 'Comissões' },
}

export const pastoralKindOrder: PastoralKind[] = ['pastoral', 'movimento', 'comissao']

export const noticeLabels: Record<NoticeCategory, string> = {
  informativo: 'Informativo',
  urgente: 'Urgente',
  liturgico: 'Litúrgico',
  evento: 'Evento',
  comunicado: 'Comunicado',
}

export const eventLabels: Record<EventCategory, string> = {
  missa: 'Missas',
  adoracao: 'Adoração',
  confissao: 'Confissões',
  evento: 'Eventos',
  reuniao: 'Reuniões',
  pastoral: 'Pastorais',
  formacao: 'Formações',
  festa: 'Festas',
  'celebracao-especial': 'Celebrações especiais',
}

export const galleryLabels: Record<GalleryCategory, string> = {
  missas: 'Missas',
  eventos: 'Eventos',
  'festa-padroeira': 'Festa da Padroeira',
  'semana-santa': 'Semana Santa',
  catequese: 'Catequese',
  juventude: 'Juventude',
  pastorais: 'Pastorais',
  'acoes-sociais': 'Ações sociais',
}

export const messageStatusLabels: Record<ContactMessage['status'], string> = {
  new: 'Nova',
  read: 'Lida',
  replied: 'Respondida',
}

export const prayerStatusLabels: Record<PrayerRequest['status'], string> = {
  new: 'Novo',
  prayed: 'Atendido',
  archived: 'Arquivado',
}
