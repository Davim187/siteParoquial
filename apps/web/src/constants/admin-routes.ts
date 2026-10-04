/** Permissões exigidas por rota do painel (qualquer uma da lista). */
export const ADMIN_ROUTE_PERMISSIONS: Record<string, readonly string[]> = {
  '/admin': ['DASHBOARD_VIEW'],
  '/admin/noticias': ['NEWS_VIEW', 'NEWS_CREATE', 'NEWS_EDIT', 'NEWS_DELETE', 'NEWS_MANAGE'],
  '/admin/avisos': ['NOTICES_MANAGE'],
  '/admin/agenda': ['EVENTS_MANAGE'],
  '/admin/missas': ['MASSES_MANAGE'],
  '/admin/pastorais': ['PASTORALS_MANAGE'],
  '/admin/sacramentos': ['SACRAMENTS_MANAGE'],
  '/admin/galeria': ['GALLERY_MANAGE'],
  '/admin/pessoas': ['PEOPLE_MANAGE'],
  '/admin/oracoes': ['PRAYERS_MANAGE'],
  '/admin/mensagens': ['MESSAGES_MANAGE'],
  '/admin/festa': ['SETTINGS_MANAGE'],
  '/admin/midia': ['MEDIA_MANAGE'],
  '/admin/usuarios': ['USERS_MANAGE'],
  '/admin/perfis': ['USERS_MANAGE'],
  '/admin/configuracoes': ['SETTINGS_MANAGE'],
}

export function permissionsForAdminPath(pathname: string): readonly string[] | undefined {
  if (pathname === '/admin/perfil') return undefined
  return ADMIN_ROUTE_PERMISSIONS[pathname]
}
