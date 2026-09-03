import 'dotenv/config'
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

const PARISH_PHONE = '(85) 98928-3869'

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
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456'
  const passwordHash = await argon2.hash(seedPassword)
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

  const categories = [
    'Comunidade',
    'Liturgia',
    'Formação',
    'Juventude',
    'Ação social',
    'Sacramentos',
    'Festa da Padroeira',
  ]
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

  const parishSettings = {
    name: 'Paróquia Nossa Senhora das Graças',
    slogan: 'Uma comunidade de fé, esperança e amor.',
    description: 'Portal oficial da Paróquia Nossa Senhora das Graças.',
    welcomeText:
      'Seja bem-vindo à nossa comunidade. Aqui, caminhamos juntos na fé, celebrando a Palavra, a Eucaristia e a vida em comunidade.',
    address: 'Rua Maria Quintino, 650, Parque Santa Maria - 60873-010',
    phone: PARISH_PHONE,
    whatsapp: PARISH_PHONE,
    email: 'secretariaparoquialpnsg.psm@gmail.com',
    instagram: '@paroquiansdasgracas',
    facebook: 'nsdasgracasparoquia',
    youtube: 'nsdasgracasparoquia',
    secretaryHours: 'Segunda a Sexta - 14h às 20h',
    mapsUrl:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d967.9867097963381!2d-38.5007014!3d-3.8537541!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7506955415eab%3A0x62bcc5304a892244!2sR.%20Maria%20Quintino%2C%20650%20-%20Parque%20Santa%20Maria%2C%20Fortaleza%20-%20CE%2C%2060873-010!5e1!3m2!1spt-BR!2sbr!4v1788204400542!5m2!1spt-BR!2sbr',
    pixKey: '[CHAVE PIX — A DEFINIR]',
    bankDetails: '[DADOS BANCÁRIOS — A DEFINIR]',
    streamingUrl: '[LINK DA TRANSMISSÃO — A DEFINIR]',
    history: 'A história completa da paróquia será publicada neste espaço. Texto demonstrativo.',
    mission: 'Evangelizar com alegria e acolher cada pessoa. Texto demonstrativo.',
    vision: 'Ser uma comunidade viva, orante e solidária. Texto demonstrativo.',
    patroness: {
      name: 'Nossa Senhora das Graças',
      history: 'A devoção a Nossa Senhora das Graças está ligada às aparições da Virgem Maria a Santa Catarina Labouré, em 1830, na França. Maria se apresentou como Mãe das Graças, convidando os fiéis à confiança, à oração e à conversão.',
      devotion: 'A devoção a Nossa Senhora das Graças expressa a confiança dos fiéis na intercessão materna de Maria. Sob seu olhar, os cristãos são convidados a fortalecer a fé, buscar a Deus e permanecer firmes na esperança.',
      medal: 'A Medalha Milagrosa nasceu a partir das aparições de Nossa Senhora a Santa Catarina Labouré. Ela recorda que as graças de Deus são concedidas àqueles que, com fé e confiança, recorrem à intercessão de Maria.',
      feast: 'Celebrada tradicionalmente em 27 de novembro, a festa de Nossa Senhora das Graças é um momento especial de fé e comunhão. A comunidade se reúne para celebrar a padroeira, participar das celebrações, renovar sua devoção e agradecer pelas graças recebidas.',
      traditions: 'A devoção a Nossa Senhora das Graças é vivida por meio da oração, da participação na Santa Missa, da novena, do Santo Rosário e de momentos de confraternização da comunidade. Essas tradições fortalecem a fé e mantêm viva a espiritualidade mariana entre as gerações.',
      image: '',
    },
    feast: {
      enabled: false,
      title: 'Festa de Nossa Senhora das Graças',
      dateLabel: '[DATA DA FESTA — A DEFINIR]',
      description: 'Banner demonstrativo da festa da Padroeira.',
      program: [],
    },
  }

  await prisma.parishSettings.upsert({
    where: { id: 'default' },
    update: parishSettings,
    create: { id: 'default', ...parishSettings },
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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
      secretaryContact: PARISH_PHONE,
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

  const people = [
    {
      name: 'Padre Bruno Xavier',
      slug: 'padre',
      type: 'PADRE' as const,
      roleTitle: 'Pároco',
      bio: '– “Antes do Seminário: Trabalhei com equipe de liturgia e grupos de oração. Sempre gostei de trabalhar com os jovens. Quando eu entrei no Seminário continuei trabalhando com jovens de várias frentes (PJ, RCC…) Gostava  de eventos, retiros que possam elevar a espiritualidade.” (depoimento dado um mês antes da ordenação diaconal)',
      quote: '',
      attendance: '',
      featured: true,
      sortOrder: 1,
    },
    {
      name: 'Diácono Carlos',
      slug: 'diacono',
      type: 'DIACONO' as const,
      roleTitle: 'Diácono permanente',
      bio: 'Biografia demonstrativa. Dados reais serão inseridos pela paróquia.',
      ministry: '[ATUAÇÃO NA COMUNIDADE — A DEFINIR]',
      featured: true,
      sortOrder: 2,
    },
  ]

  for (const person of people) {
    await prisma.person.upsert({
      where: { slug: person.slug },
      update: person,
      create: person,
    })
  }

  const pastorals = [
    {
      name: 'Catequese',
      slug: 'catequese',
      description:
        'A Catequese tem como missão anunciar e ensinar a fé cristã, ajudando crianças, adolescentes e adultos a conhecerem melhor Jesus Cristo e os ensinamentos da Igreja. É um caminho de formação, descoberta da fé e preparação para uma vida cristã mais comprometida.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Comunicação',
      slug: 'pastoral-da-comunicacao',
      description:
        'A PASCOM tem como missão comunicar a vida e a missão da Igreja, utilizando os meios de comunicação para evangelizar, informar e aproximar a comunidade.\n\nPor meio das redes sociais, fotos, vídeos e outros canais, a pastoral divulga as celebrações, eventos e ações da paróquia, levando a mensagem de Cristo para além dos limites da Igreja.\n',
      responsible: 'Eduarda',
      phone: '85 9 82306380',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Coroinhas e Mestres',
      slug: 'pastoral-dos-coroinhas-e-mestres',
      description:
        'A Pastoral dos Coroinhas e Cerimoniários tem como missão servir a Deus e à comunidade, auxiliando nas celebrações litúrgicas com fé, alegria e dedicação. É também um espaço de aprendizado, convivência e crescimento na fé.\n\nCoroinhas: auxiliam o sacerdote e servem no altar durante as celebrações.\n\nCerimoniários: orientam os coroinhas e coordenam os serviços litúrgicos, contribuindo para que as celebrações aconteçam de forma organizada e solene.\n\n\nCoordenador: João Victor \nVice Coordenador: Davi Morais\nSecretario: Lucas Monteiro',
      responsible: 'João Victor',
      phone: '85 9 97970715',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Criança',
      slug: 'pastoral-da-crianca',
      description:
        'A Pastoral da Criança atua junto às crianças e suas famílias, promovendo cuidado, acompanhamento e orientação. Seu trabalho busca contribuir para o desenvolvimento integral das crianças e fortalecer os vínculos entre as famílias e a comunidade.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Dízimo',
      slug: 'pastoral-do-dizimo',
      description:
        'A Pastoral do Dízimo ajuda a comunidade a compreender o verdadeiro sentido da partilha e da contribuição para a missão da Igreja. Por meio do dízimo, os fiéis colaboram com as necessidades da paróquia, com a evangelização e com as ações realizadas em benefício da comunidade.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'ECC',
      slug: 'ecc',
      description:
        'O Encontro de Casais com Cristo (ECC) é um serviço da Igreja voltado aos casais e às famílias, buscando fortalecer a vida matrimonial e familiar à luz do Evangelho. É um espaço de encontro, diálogo, espiritualidade e crescimento na fé, aproximando os casais de Deus e da comunidade.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Grupo de Jovens',
      slug: 'grupo-de-jovens',
      description:
        'O Grupo de Jovens é um espaço de encontro, amizade, partilha e crescimento na fé. Busca ajudar os jovens a conhecerem e seguirem Jesus Cristo, fortalecendo sua participação na Igreja e incentivando-os a colocar seus dons a serviço da comunidade.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '[HORÁRIO]',
      location: '[LOCAL]',
      active: true,
    },
    {
      name: 'Leitores',
      slug: 'leitores',
      description:
        'Os leitores têm a importante missão de proclamar a Palavra de Deus durante as celebrações, ajudando a comunidade a ouvir e compreender a mensagem das Sagradas Escrituras. Com preparação, dedicação e responsabilidade, colaboram para que a Palavra alcance o coração de cada fiel.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'MESC',
      slug: 'pastoral-do-mesc',
      description:
        'O MESC tem como missão auxiliar na distribuição da Sagrada Comunhão durante as celebrações e levar a Eucaristia aos enfermos e àqueles que não podem participar da Santa Missa.\n\nCom fé, dedicação e espírito de serviço, os ministros colaboram para fortalecer a vida espiritual e a comunhão de toda a comunidade.',
      responsible: 'Everardo',
      phone: '85 9 84184889',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Ministério de Música',
      slug: 'ministerio-de-musica',
      description:
        'O Ministério de Música tem a missão de servir à comunidade por meio da música e do canto, contribuindo para a oração e a participação dos fiéis nas celebrações. Com seus dons e talentos, seus integrantes ajudam a tornar a liturgia um momento de louvor, reflexão e encontro com Deus.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
    {
      name: 'Pessoa Idosa',
      slug: 'pastoral-da-pessoa-idosa',
      description:
        'A Pastoral da Pessoa Idosa tem como missão acolher, acompanhar e valorizar as pessoas idosas, reconhecendo sua importância na família e na comunidade. Por meio da presença e da convivência, busca promover dignidade, cuidado e participação na vida da Igreja.',
      responsible: '[RESPONSÁVEL]',
      phone: '[CONTATO]',
      meetingTime: '...',
      location: '...',
      active: true,
    },
  ]

  for (const pastoral of pastorals) {
    await prisma.pastoral.upsert({
      where: { slug: pastoral.slug },
      update: pastoral,
      create: pastoral,
    })
  }

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

  console.log('Seed concluído.')
  if (process.env.NODE_ENV !== 'production') {
    console.log('Usuário admin de desenvolvimento criado (admin@demo.paroquia).')
    console.log('Defina SEED_ADMIN_PASSWORD no ambiente para personalizar a senha do seed.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
