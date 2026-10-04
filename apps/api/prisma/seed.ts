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
      summary: 'A porta de entrada na vida cristã e na comunidade da Igreja.',
      content:
        'No Batismo, celebramos o nascimento para a vida nova em Cristo. É o primeiro passo da iniciação cristã e o início do caminho de fé na comunidade parroquial.',
      whatItIs:
        'Pelo Batismo, a pessoa é mergulhada no mistério da morte e ressurreição de Jesus, torna-se filha de Deus e passa a fazer parte da Igreja. É o sacramento que inaugura a vida cristã e abre o caminho para os demais sacramentos.',
      whoCanReceive:
        'Crianças, por pedido dos pais e com a presença dos padrinhos; e adultos, após o caminho de preparação catecumenal. Em todos os casos, a família é acolhida e orientada pela paróquia.',
      howItWorks:
        'Procure a secretaria paroquial para iniciar o processo. Haverá orientação sobre a preparação dos pais e padrinhos, os documentos necessários e o agendamento da celebração, conforme a disponibilidade da agenda litúrgica.',
      documents: [
        'Certidão de nascimento da criança (ou documento de identidade, no caso de adultos)',
        'Documentos de identidade dos pais',
        'Documentos de identidade dos padrinhos',
        'Comprovante de Batismo dos padrinhos (se batizados em outra paróquia)',
        'Comprovante de residência',
      ],
      howToRegister:
        'Dirija-se à secretaria paroquial para preencher a ficha de inscrição e receber as orientações sobre a preparação e a data da celebração.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 1,
    },
    {
      name: 'Primeira Eucaristia',
      slug: 'primeira-eucaristia',
      summary: 'O encontro com Jesus no Pão e no Vinho consagrados.',
      content:
        'A Primeira Eucaristia marca um momento especial na vida da criança, do adolescente ou do adulto: a primeira comunhão com o Corpo e o Sangue de Cristo, centro da vida cristã.',
      whatItIs:
        'A Eucaristia é o sacramento do Corpo e do Sangue de Cristo. Nela, a Igreja celebra a Páscoa do Senhor e se alimenta do próprio Jesus, fonte de comunhão, força e vida para o dia a dia na fé.',
      whoCanReceive:
        'Crianças e adolescentes que concluíram o itinerário da catequese definido pela paróquia; também adultos em processo próprio de preparação. É necessário estar batizado e participar da formação com a família.',
      howItWorks:
        'A preparação acontece na catequese, com encontros regulares, acompanhamento das famílias e celebração comunitária da Primeira Comunhão. As datas de inscrição e a programação são divulgadas pela Pastoral da Catequese e pela secretaria.',
      documents: [
        'Certidão de Batismo',
        'Documento de identidade ou certidão de nascimento',
        'Comprovante de residência',
        'Fotos 3x4 (conforme orientação da catequese)',
      ],
      howToRegister:
        'Procure a Pastoral da Catequese ou a secretaria paroquial no período de inscrições para conhecer o itinerário e garantir a vaga.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 2,
    },
    {
      name: 'Crisma',
      slug: 'crisma',
      summary: 'A Confirmação que sela o batizado com o dom do Espírito Santo.',
      content:
        'Na Crisma, o Espírito Santo confirma e fortalece a graça do Batismo, enviando o cristão a testemunhar a fé com coragem e responsabilidade na Igreja e no mundo.',
      whatItIs:
        'A Crisma, ou Confirmação, completa a iniciação cristã. Pela imposição das mãos e pela unção com o santo crisma, o batizado recebe de modo especial o Espírito Santo para viver e anunciar o Evangelho.',
      whoCanReceive:
        'Fiéis batizados que concluíram a preparação prevista pela diocese e pela paróquia, geralmente adolescentes e jovens, além de adultos em itinerário próprio.',
      howItWorks:
        'O caminho inclui encontros de formação, acompanhamento pastoral e a celebração com o bispo ou seu delegado. As turmas e os períodos de inscrição são anunciados pela catequese e pela secretaria.',
      documents: [
        'Certidão de Batismo',
        'Documento de identidade',
        'Comprovante de residência',
        'Comprovante de participação na catequese (quando solicitado)',
      ],
      howToRegister:
        'Acompanhe os avisos da catequese e faça a inscrição na secretaria no período indicado para cada turma.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 3,
    },
    {
      name: 'Confissão',
      slug: 'confissao',
      summary: 'O encontro com a misericórdia de Deus que reconcilia e renova.',
      content:
        'No sacramento da Reconciliação, Deus acolhe o filho que reconhece suas faltas e deseja recomeçar. É um caminho de paz, perdão e volta à comunhão com Deus e com a Igreja.',
      whatItIs:
        'Na Confissão, o penitente reconhece o pecado, pede perdão de coração e recebe a absolvição. O sacramento reconcilia com Deus, cura a consciência e fortalece a vida cristã.',
      whoCanReceive:
        'Todo batizado que deseja se reconciliar com Deus, com as devidas disposições: exame de consciência, arrependimento, propósito de mudança e cumprimento da penitência.',
      howItWorks:
        'Os horários de atendimento são divulgados na agenda da paróquia e nos avisos. Em caso de necessidade especial, procure a secretaria ou o pároco para orientar o melhor momento.',
      documents: ['Não há documentos específicos.'],
      howToRegister:
        'Não é necessária inscrição prévia. Compareça nos horários de confissão ou solicite atendimento pastoral quando precisar.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 4,
    },
    {
      name: 'Matrimônio',
      slug: 'matrimonio',
      summary: 'A aliança de amor entre os esposos, sinal de Cristo e da Igreja.',
      content:
        'O Matrimônio é a celebração do amor que se torna aliança diante de Deus. Os noivos são acolhidos pela comunidade e preparados para construir uma família fundada na fé, no diálogo e na fidelidade.',
      whatItIs:
        'O sacramento do Matrimônio une o homem e a mulher em uma aliança indissolúvel de amor e vida. É sinal do amor de Cristo pela Igreja e fonte de graça para a caminhada do casal.',
      whoCanReceive:
        'Noivos livres para contrair matrimônio, após o processo de habilitação canônica e a preparação matrimonial exigida pela Igreja.',
      howItWorks:
        'Inicie o processo na secretaria com boa antecedência. Haverá entrevistas, orientação sobre documentos, encontros de preparação dos noivos e o agendamento da celebração conforme a disponibilidade da paróquia.',
      documents: [
        'Certidão de Batismo atualizada (emitida há menos de seis meses)',
        'Documento de identidade e CPF dos noivos',
        'Comprovante de residência',
        'Certidão de nascimento',
        'Outros documentos indicados pela secretaria no início do processo',
      ],
      howToRegister:
        'Agende um atendimento na secretaria paroquial para abrir o processo matrimonial e receber o calendário da preparação.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 5,
    },
    {
      name: 'Unção dos Enfermos',
      slug: 'uncao-dos-enfermos',
      summary: 'O sacramento que conforta, fortalece e une o doente a Cristo.',
      content:
        'A Unção dos Enfermos é gesto de cuidado e esperança. Por ela, a Igreja se faz próxima de quem enfrenta a doença, a fragilidade ou a idade avançada, pedindo a graça da paz e da força.',
      whatItIs:
        'Este sacramento une o doente à paixão de Cristo, trazendo conforto, coragem e, se for vontade de Deus, o restabelecimento da saúde. Também prepara o coração para confiar plenamente no Senhor.',
      whoCanReceive:
        'Fiéis em enfermidade grave, idade avançada, recuperação delicada ou diante de cirurgia importante. Pode ser recebido mais de uma vez, conforme a necessidade.',
      howItWorks:
        'A família ou o próprio fiel pode solicitar o sacramento à secretaria ou ao pároco. Em situações de urgência, utilize os canais de contato da paróquia para atendimento o mais breve possível.',
      documents: [
        'Informar a situação de saúde e o local de atendimento (residência, hospital ou outro)',
        'Nome e telefone de um responsável para contato',
      ],
      howToRegister:
        'Faça o pedido pela secretaria, pelo pároco ou por meio dos contatos oficiais da paróquia. A equipe pastoral orientará o atendimento.',
      secretaryContact: PARISH_PHONE,
      sortOrder: 6,
    },
    {
      name: 'Ordem',
      slug: 'ordem',
      summary: 'O sacramento do serviço: diáconos, presbíteros e bispos.',
      content:
        'Pelo sacramento da Ordem, a Igreja recebe ministros para servir o Povo de Deus na pregação, na liturgia e na caridade. É um caminho de discernimento, formação e doação da vida.',
      whatItIs:
        'A Ordem configura o homem a Cristo servo e pastor, para o ministério ordenado na Igreja. Diáconos, padres e bispos são chamados a anunciar o Evangelho e a cuidar da comunidade com amor.',
      whoCanReceive:
        'Candidatos chamados e aprovados pela Igreja, segundo as normas da diocese, após sério discernimento vocacional e acompanhamento formativo.',
      howItWorks:
        'O primeiro passo é uma conversa aberta com o pároco. O discernimento continua com o serviço vocacional da diocese, a formação no seminário e o acompanhamento da comunidade.',
      documents: [
        'Processo vocacional diocesano',
        'Documentação pessoal e eclesial solicitada pela diocese ao longo da formação',
      ],
      howToRegister:
        'Converse com o pároco e, a partir dessa escuta, procure o serviço vocacional da diocese para iniciar o acompanhamento.',
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
