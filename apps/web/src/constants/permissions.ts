export const PERMISSION_GROUPS: Array<{ title: string; codes: string[] }> = [
  {
    title: 'Conteúdo',
    codes: ['NEWS_VIEW', 'NEWS_CREATE', 'NEWS_EDIT', 'NEWS_DELETE', 'NEWS_MANAGE', 'NOTICES_MANAGE'],
  },
  {
    title: 'Eventos e liturgia',
    codes: ['EVENTS_MANAGE', 'MASSES_MANAGE', 'SACRAMENTS_MANAGE'],
  },
  {
    title: 'Comunidade',
    codes: ['PASTORALS_MANAGE', 'PEOPLE_MANAGE', 'PRAYERS_MANAGE', 'MESSAGES_MANAGE'],
  },
  {
    title: 'Mídia',
    codes: ['GALLERY_MANAGE', 'MEDIA_MANAGE'],
  },
  {
    title: 'Sistema',
    codes: ['DASHBOARD_VIEW', 'USERS_MANAGE', 'SETTINGS_MANAGE'],
  },
]

export function slugifyRoleCode(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
}
