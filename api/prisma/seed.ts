import '../src/config/load-env.js'
import argon2 from 'argon2'
import {
  PermissionCode,
  PrismaClient,
} from '@prisma/client'

const prisma = new PrismaClient()

const ALL_PERMISSIONS: Array<{ code: PermissionCode; name: string }> = [
  { code: 'DASHBOARD_VIEW', name: 'Visualizar dashboard' },
  { code: 'NEWS_VIEW', name: 'Visualizar notícias' },
  { code: 'NEWS_CREATE', name: 'Criar notícias' },
  { code: 'NEWS_EDIT', name: 'Editar notícias' },
  { code: 'NEWS_DELETE', name: 'Excluir notícias' },
  { code: 'NEWS_MANAGE', name: 'Gerenciar notícias' },
  { code: 'NOTICES_MANAGE', name: 'Gerenciar avisos' },
  { code: 'EVENTS_MANAGE', name: 'Gerenciar eventos' },
  { code: 'MASSES_MANAGE', name: 'Gerenciar missas' },
  { code: 'PASTORALS_MANAGE', name: 'Gerenciar pastorais' },
  { code: 'SACRAMENTS_MANAGE', name: 'Gerenciar sacramentos' },
  { code: 'PEOPLE_MANAGE', name: 'Gerenciar pessoas' },
  { code: 'GALLERY_MANAGE', name: 'Gerenciar galeria' },
  { code: 'MEDIA_MANAGE', name: 'Gerenciar mídia' },
  { code: 'PRAYERS_MANAGE', name: 'Gerenciar pedidos de oração' },
  { code: 'MESSAGES_MANAGE', name: 'Gerenciar mensagens' },
  { code: 'USERS_MANAGE', name: 'Gerenciar usuários' },
  { code: 'SETTINGS_MANAGE', name: 'Gerenciar configurações' },
]

const ROLE_PERMS: Record<string, PermissionCode[]> = {
  ADMIN: ALL_PERMISSIONS.map((p) => p.code),
  EDITOR: [
    'DASHBOARD_VIEW',
    'NEWS_VIEW',
    'NEWS_CREATE',
    'NEWS_EDIT',
    'NEWS_DELETE',
    'NEWS_MANAGE',
    'NOTICES_MANAGE',
    'EVENTS_MANAGE',
    'GALLERY_MANAGE',
    'MEDIA_MANAGE',
  ],
  SECRETARIA: [
    'DASHBOARD_VIEW',
    'MASSES_MANAGE',
    'EVENTS_MANAGE',
    'SACRAMENTS_MANAGE',
    'PEOPLE_MANAGE',
    'PRAYERS_MANAGE',
    'MESSAGES_MANAGE',
  ],
  COMUNICACAO: [
    'DASHBOARD_VIEW',
    'NEWS_VIEW',
    'NEWS_CREATE',
    'NEWS_EDIT',
    'NEWS_MANAGE',
    'NOTICES_MANAGE',
    'GALLERY_MANAGE',
    'MEDIA_MANAGE',
  ],
}

async function main() {
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name },
      create: perm,
    })
  }

  const roleDefs: Array<{ code: string; name: string; description: string }> = [
    { code: 'ADMIN', name: 'Administrador', description: 'Acesso total ao sistema' },
    { code: 'EDITOR', name: 'Editor', description: 'Notícias, avisos, eventos e galeria' },
    { code: 'SECRETARIA', name: 'Secretaria', description: 'Missas, eventos, sacramentos e pessoas' },
    { code: 'COMUNICACAO', name: 'Comunicação', description: 'Notícias, avisos e mídia' },
  ]

  for (const role of roleDefs) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    })
    await prisma.rolePermission.deleteMany({ where: { roleId: saved.id } })
    for (const code of ROLE_PERMS[role.code]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } })
      await prisma.rolePermission.create({
        data: { roleId: saved.id, permissionId: permission.id },
      })
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } })
  const passwordHash = await argon2.hash('Admin@123456')
  await prisma.user.upsert({
    where: { email: 'admin@demo.paroquia' },
    update: {
      name: 'Administrador Demo',
      passwordHash,
      active: true,
      roleId: adminRole.id,
    },
    create: {
      name: 'Administrador Demo',
      email: 'admin@demo.paroquia',
      passwordHash,
      roleId: adminRole.id,
    },
  })

  const categories = ['Comunidade', 'Liturgia', 'Formação', 'Juventude', 'Ação social', 'Sacramentos', 'Festa da Padroeira']
  for (const name of categories) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
    await prisma.newsCategory.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    })
  }

  await prisma.parishSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Paróquia Nossa Senhora das Graças',
      slogan: 'Uma comunidade de fé, esperança e amor.',
      description: 'Portal oficial da Paróquia Nossa Senhora das Graças.',
      welcomeText:
        'Seja bem-vindo à nossa comunidade. Aqui, caminhamos juntos na fé, celebrando a Palavra, a Eucaristia e a vida em comunidade.',
      address: '[ENDEREÇO DA PARÓQUIA]',
      phone: '[TELEFONE]',
      whatsapp: '[WHATSAPP]',
      email: '[E-MAIL]',
      instagram: '[INSTAGRAM]',
      facebook: '[FACEBOOK]',
      youtube: '[YOUTUBE]',
      secretaryHours: '[HORÁRIO DA SECRETARIA]',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=igreja+catolica',
      pixKey: '[CHAVE PIX — A DEFINIR]',
      bankDetails: '[DADOS BANCÁRIOS — A DEFINIR]',
      streamingUrl: '[LINK DA TRANSMISSÃO — A DEFINIR]',
      history:
        'A história completa da paróquia será publicada neste espaço. Texto demonstrativo.',
      mission: 'Evangelizar com alegria e acolher cada pessoa. Texto demonstrativo.',
      vision: 'Ser uma comunidade viva, orante e solidária. Texto demonstrativo.',
      patroness: {
        name: 'Nossa Senhora das Graças',
        history: 'Invocação ligada às aparições a Santa Catarina Labouré (1830). Texto institucional.',
        devotion: 'Confiança na intercessão maternal de Maria.',
        medal: 'A Medalha Milagrosa simboliza as graças pedidas com fé.',
        feast: '[DATA DA FESTA — A DEFINIR]',
        traditions: '[TRADIÇÕES LOCAIS — A DEFINIR]',
        image: '',
      },
      feast: {
        enabled: true,
        title: 'Festa de Nossa Senhora das Graças',
        dateLabel: '[DATA DA FESTA — A DEFINIR]',
        description: 'Banner demonstrativo da festa da Padroeira.',
        program: [],
      },
    },
  })

  const sacraments = [
    {
      name: 'Batismo',
      slug: 'batismo',
      summary: 'Porta da vida cristã.',
      content: 'Conteúdo demonstrativo sobre o Batismo.',
      whatItIs: 'Sacramento da iniciação cristã.',
      whoCanReceive: 'Crianças e adultos conforme orientação pastoral.',
      howItWorks: 'Procure a secretaria. [A CONFIRMAR]',
      documents: ['[DOCUMENTOS — A DEFINIR]'],
      howToRegister: 'Inscrição na secretaria.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 1,
    },
    {
      name: 'Primeira Eucaristia',
      slug: 'primeira-eucaristia',
      summary: 'Encontro com Jesus na Eucaristia.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Sacramento do Corpo e Sangue de Cristo.',
      whoCanReceive: 'Crianças e adultos preparados pela catequese.',
      howItWorks: 'Itinerário catequético. [A CONFIRMAR]',
      documents: ['[DOCUMENTOS — A DEFINIR]'],
      howToRegister: 'Pastoral da Catequese / secretaria.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 2,
    },
    {
      name: 'Crisma',
      slug: 'crisma',
      summary: 'Confirmação no Espírito Santo.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Sacramento da Confirmação.',
      whoCanReceive: 'Batizados após preparação.',
      howItWorks: 'Encontros e celebração. [A CONFIRMAR]',
      documents: ['[DOCUMENTOS — A DEFINIR]'],
      howToRegister: 'Catequese / secretaria.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 3,
    },
    {
      name: 'Confissão',
      slug: 'confissao',
      summary: 'Sacramento da Reconciliação.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Encontro com a misericórdia de Deus.',
      whoCanReceive: 'Batizados com as devidas disposições.',
      howItWorks: 'Horários publicados na agenda. [A CONFIRMAR]',
      documents: ['Não há documentos específicos.'],
      howToRegister: 'Sem inscrição prévia.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 4,
    },
    {
      name: 'Matrimônio',
      slug: 'matrimonio',
      summary: 'Aliança sacramental dos esposos.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Sacramento do Matrimônio.',
      whoCanReceive: 'Noivos livres para contrair matrimônio.',
      howItWorks: 'Processo na secretaria com antecedência. [A CONFIRMAR]',
      documents: ['[DOCUMENTOS — A DEFINIR]'],
      howToRegister: 'Agende atendimento na secretaria.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 5,
    },
    {
      name: 'Unção dos Enfermos',
      slug: 'uncao-dos-enfermos',
      summary: 'Conforto aos doentes.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Sacramento que une o doente a Cristo.',
      whoCanReceive: 'Fiéis em enfermidade grave ou idade avançada.',
      howItWorks: 'Solicite à secretaria ou ao pároco.',
      documents: ['Informar situação de saúde.'],
      howToRegister: 'Pedido pela família ou secretaria.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 6,
    },
    {
      name: 'Ordem',
      slug: 'ordem',
      summary: 'Ministério ordenado na Igreja.',
      content: 'Conteúdo demonstrativo.',
      whatItIs: 'Sacramento do serviço apostólico.',
      whoCanReceive: 'Candidatos aprovados pela Igreja.',
      howItWorks: 'Discernimento vocacional diocesano.',
      documents: ['Processo vocacional.'],
      howToRegister: 'Converse com o pároco.',
      secretaryContact: '[CONTATO DA SECRETARIA]',
      sortOrder: 7,
    },
  ]

  for (const sacrament of sacraments) {
    await prisma.sacrament.upsert({
      where: { slug: sacrament.slug },
      update: sacrament,
      create: sacrament,
    })
  }

  await prisma.person.upsert({
    where: { slug: 'padre' },
    update: {},
    create: {
      name: '[NOME DO PADRE]',
      slug: 'padre',
      type: 'PADRE',
      roleTitle: 'Pároco',
      bio: 'Biografia demonstrativa. Nenhuma informação pessoal real foi inventada.',
      quote: '[MENSAGEM DO PÁROCO — A DEFINIR]',
      attendance: '[HORÁRIO DE ATENDIMENTO DO PÁROCO]',
      featured: true,
      sortOrder: 1,
    },
  })
  await prisma.person.upsert({
    where: { slug: 'diacono' },
    update: {},
    create: {
      name: '[NOME DO DIÁCONO]',
      slug: 'diacono',
      type: 'DIACONO',
      roleTitle: 'Diácono permanente',
      bio: 'Biografia demonstrativa. Dados reais serão inseridos pela paróquia.',
      ministry: '[ATUAÇÃO NA COMUNIDADE — A DEFINIR]',
      featured: true,
      sortOrder: 2,
    },
  })

  const masses = [
    { weekday: 0, time: '07:00', type: 'Santa Missa', location: 'Igreja Matriz', notes: 'Domingo' },
    { weekday: 0, time: '16:00', type: 'Santa Missa', location: 'Igreja Matriz', notes: 'Domingo' },
    { weekday: 0, time: '19:00', type: 'Santa Missa', location: 'Igreja Matriz', notes: 'Domingo' },
    { weekday: 5, time: '19:00', type: 'Santa Missa', location: 'Igreja Matriz', notes: 'Sexta-feira' },
  ]

  await prisma.event.deleteMany({
    where: {
      type: 'MISSA',
      startsAt: { gte: new Date('2026-09-01T00:00:00'), lt: new Date('2026-10-01T00:00:00') },
    },
  })

  await prisma.massSchedule.deleteMany({
    where: {
      date: { gte: new Date('2026-09-01T00:00:00'), lt: new Date('2026-10-01T00:00:00') },
    },
  })

  const septemberMasses: Array<{
    date: Date
    time: string
    type: string
    location: string
    notes: string
  }> = []

  for (let day = 1; day <= 30; day += 1) {
    const date = new Date(2026, 8, day, 12, 0, 0, 0)
    const weekday = date.getDay()

    const pushMass = (time: string, notes: string) => {
      septemberMasses.push({
        date,
        time,
        type: 'Santa Missa',
        location: 'Igreja Matriz',
        notes,
      })
    }

    if (weekday === 0) {
      pushMass('07:00', 'Domingo')
      pushMass('16:00', 'Domingo')
      pushMass('19:00', 'Domingo')
    }
    if (weekday === 5) {
      pushMass('19:00', 'Sexta-feira')
    }
    if (day === 13 && weekday !== 0 && weekday !== 5) {
      pushMass('19:00', 'Dia 13')
    }
  }

  if (septemberMasses.length > 0) {
    await prisma.massSchedule.createMany({
      data: septemberMasses.map((mass) => ({
        date: mass.date,
        weekday: null,
        time: mass.time,
        type: mass.type,
        location: mass.location,
        notes: mass.notes,
      })),
    })
  }

  for (const mass of masses) {
    const existing = await prisma.massSchedule.findFirst({
      where: { weekday: mass.weekday, time: mass.time, date: null },
    })
    if (existing) {
      await prisma.massSchedule.update({ where: { id: existing.id }, data: mass })
    } else {
      await prisma.massSchedule.create({ data: { ...mass, date: null } })
    }
  }

  const feastCat = await prisma.newsCategory.findUnique({ where: { slug: 'festa-da-padroeira' } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.paroquia' } })
  if (admin && feastCat) {
    await prisma.news.upsert({
      where: { slug: 'festa-da-padroeira' },
      update: {},
      create: {
        title: 'Festa da Padroeira: programação em preparação',
        slug: 'festa-da-padroeira',
        subtitle: 'Conteúdo demonstrativo',
        excerpt: 'A comunidade se prepara para honrar a Padroeira. Datas oficiais serão publicadas.',
        content:
          '<p>Este é um texto demonstrativo sobre a Festa de Nossa Senhora das Graças.</p><p>Quando a paróquia definir a programação oficial, este espaço será atualizado.</p>',
        status: 'PUBLISHED',
        featured: true,
        publishedAt: new Date(),
        authorId: admin.id,
        categoryId: feastCat.id,
      },
    })
  }

  await prisma.notice.createMany({
    data: [
      {
        title: 'Horários especiais desta semana',
        description:
          'Confira os horários especiais das celebrações. Conteúdo demonstrativo até confirmação da secretaria.',
        category: 'LITURGIA',
        featured: true,
        priority: 10,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    ],
    skipDuplicates: true,
  })

  console.log('Seed concluído.')
  console.log('Usuário demo: admin@demo.paroquia')
  console.log('Senha demo: Admin@123456 (trocar em produção)')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
