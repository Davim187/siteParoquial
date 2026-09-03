import type {
  ContactMessage,
  GalleryItem,
  Mass,
  NewsArticle,
  Notice,
  ParishEvent,
  ParishSettings,
  Pastoral,
  PatronFeast,
  Person,
  PrayerRequest,
  Sacrament,
} from '@/types'

const img = {
  church:
    'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1800&q=80',
  nave:
    'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80',
  stained:
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80',
  candles:
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80',
  community:
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=80',
  youth:
    'https://images.unsplash.com/photo-1529070538774-184bbc514ac1?auto=format&fit=crop&w=1600&q=80',
  choir:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
  hands:
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80',
  mary:
    'https://images.unsplash.com/photo-1508363778367-af354e7bb9d4?auto=format&fit=crop&w=1200&q=80',
  medal:
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  altar:
    'https://images.unsplash.com/photo-1473177027534-53d906e9ab5f?auto=format&fit=crop&w=1600&q=80',
  night:
    'https://images.unsplash.com/photo-1548625149-fc4a2de7e8d4?auto=format&fit=crop&w=1600&q=80',
  portrait:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
}

export const defaultSettings: ParishSettings = {
  name: 'Paróquia Nossa Senhora das Graças',
  slogan: 'Uma comunidade de fé, esperança e amor.',
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
    'A história completa da Paróquia Nossa Senhora das Graças ainda será publicada neste espaço. Este texto é demonstrativo e será substituído pelo relato oficial da comunidade, da fundação da igreja e dos marcos da vida paroquial.',
  mission:
    'Evangelizar com alegria, acolher cada pessoa e formar discípulos missionários que celebram, servem e anunciam Jesus Cristo no cotidiano da comunidade. Texto demonstrativo — a ser confirmado pela paróquia.',
  vision:
    'Ser uma comunidade viva, orante e solidária, unida em torno da Eucaristia, da Palavra e da caridade. Texto demonstrativo — a ser confirmado pela paróquia.',
  patroness: {
    name: 'Nossa Senhora das Graças',
    history:
      'A invocação de Nossa Senhora das Graças está ligada às aparições de Maria a Santa Catarina Labouré, em 1830, em Paris. A Virgem pediu que se cunhasse uma medalha, pela qual muitas graças seriam derramadas sobre quem a usasse com fé. Este texto é institucional e poderá ser complementado com a história local da paróquia.',
    devotion:
      'A devoção a Nossa Senhora das Graças convida a confiar na intercessão maternal de Maria, a rezar o terço, a viver a conversão e a buscar as graças de Deus no cotidiano. A comunidade celebra essa presença com novenas, missas e gestos de fé.',
    medal:
      'A Medalha Milagrosa traz Maria de pé sobre o globo, com as mãos abertas, das quais saem raios — símbolo das graças que ela obtém para quem as pede. No verso, o M de Maria entrelaçado à cruz, o Sagrado Coração de Jesus e o Imaculado Coração de Maria, cercados de doze estrelas.',
    feast:
      'A festa da Padroeira será apresentada com data, programação da novena, missas, procissão e demais celebrações quando a paróquia publicar o calendário oficial. Até lá, este espaço permanece como conteúdo demonstrativo.',
    traditions:
      'As tradições da comunidade — novena, quermesse, procissão e demais costumes — serão descritas aqui após confirmação da paróquia. [TRADIÇÕES LOCAIS — A DEFINIR]',
    image: img.mary,
  },
}

export const defaultFeast: PatronFeast = {
  enabled: true,
  title: 'Festa de Nossa Senhora das Graças',
  dateLabel: '[DATA DA FESTA — A DEFINIR]',
  description:
    'Banner demonstrativo da festa da Padroeira. O administrador pode ativar ou desativar este destaque e cadastrar a programação da novena, missas, procissão, quermesse e demais eventos.',
  program: [
    {
      id: 'feast-1',
      date: '2026-11-18',
      time: '19:30',
      title: 'Abertura da Novena (demonstrativo)',
      description: 'Programação cadastrável pelo painel administrativo.',
      type: 'novena',
    },
    {
      id: 'feast-2',
      date: '2026-11-27',
      time: '19:00',
      title: 'Missa solene da Padroeira (demonstrativo)',
      description: 'Horário e rito a confirmar.',
      type: 'missa',
    },
    {
      id: 'feast-3',
      date: '2026-11-27',
      time: '16:00',
      title: 'Procissão (demonstrativo)',
      description: 'Percurso a definir.',
      type: 'procissao',
    },
  ],
}

export const seedNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'Horários especiais desta semana',
    description:
      'Confira os horários especiais das celebrações desta semana. Conteúdo demonstrativo — os horários reais serão publicados pela secretaria.',
    date: '2026-08-24',
    category: 'liturgico',
    featured: true,
    status: 'published',
  },
  {
    id: 'notice-2',
    title: 'Inscrições para catequese',
    description:
      'Aviso demonstrativo: as inscrições para a catequese serão divulgadas com datas e documentos necessários.',
    date: '2026-08-20',
    category: 'informativo',
    featured: false,
    status: 'published',
  },
  {
    id: 'notice-3',
    title: 'Campanha da solidariedade',
    description:
      'Comunicado demonstrativo sobre ações sociais da paróquia. Detalhes serão atualizados pela Pastoral Social.',
    date: '2026-08-18',
    category: 'comunicado',
    featured: false,
    status: 'published',
  },
]

export const seedMasses: Mass[] = [
  {
    id: 'mass-1',
    weekday: 'Segunda-feira',
    date: '2026-08-24',
    time: '19:00',
    type: 'Santa Missa',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
  {
    id: 'mass-2',
    weekday: 'Quarta-feira',
    date: '2026-08-26',
    time: '19:00',
    type: 'Santa Missa',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
  {
    id: 'mass-3',
    weekday: 'Sábado',
    date: '2026-08-29',
    time: '17:00',
    type: 'Missa vespertina',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
  {
    id: 'mass-4',
    weekday: 'Domingo',
    date: '2026-08-30',
    time: '08:00',
    type: 'Santa Missa',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
  {
    id: 'mass-5',
    weekday: 'Domingo',
    date: '2026-08-30',
    time: '19:00',
    type: 'Santa Missa',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
  {
    id: 'mass-6',
    weekday: 'Domingo',
    date: '2026-09-06',
    time: '19:00',
    type: 'Santa Missa',
    location: 'Igreja Matriz',
    notes: 'Horário demonstrativo',
  },
]

export const seedEvents: ParishEvent[] = [
  {
    id: 'event-1',
    title: 'Adoração ao Santíssimo (demonstrativo)',
    date: '2026-08-28',
    time: '20:00',
    location: 'Igreja Matriz',
    description: 'Momento de oração silenciosa. Horário e formato a confirmar.',
    category: 'adoracao',
    responsible: '[RESPONSÁVEL]',
  },
  {
    id: 'event-2',
    title: 'Reunião da Pastoral da Catequese (demonstrativo)',
    date: '2026-08-27',
    time: '19:30',
    location: '[LOCAL]',
    description: 'Encontro formativo da equipe. Conteúdo demonstrativo.',
    category: 'pastoral',
    responsible: '[COORDENAÇÃO]',
  },
  {
    id: 'event-3',
    title: 'Encontro de jovens (demonstrativo)',
    date: '2026-08-29',
    time: '19:30',
    location: '[SALÃO PAROQUIAL]',
    description: 'Encontro da juventude. Programação a publicar.',
    image: img.youth,
    category: 'evento',
  },
  {
    id: 'event-4',
    title: 'Confissões (demonstrativo)',
    date: '2026-08-29',
    time: '15:00',
    endTime: '16:30',
    location: 'Igreja Matriz',
    description: 'Horário demonstrativo de atendimento sacramentário.',
    category: 'confissao',
  },
  {
    id: 'event-5',
    title: 'Formação para ministros (demonstrativo)',
    date: '2026-09-03',
    time: '19:30',
    location: '[SALA DE REUNIÕES]',
    description: 'Encontro de formação. Tema a definir.',
    category: 'formacao',
  },
]

export const seedNews: NewsArticle[] = [
  {
    id: 'news-1',
    slug: 'festa-da-padroeira',
    title: 'Festa da Padroeira: programação em preparação',
    subtitle: 'Conteúdo demonstrativo da festa de Nossa Senhora das Graças',
    excerpt:
      'A comunidade se prepara para honrar a Padroeira. Datas, novena e demais detalhes serão publicados oficialmente.',
    content: `<p>Este é um texto demonstrativo sobre a Festa de Nossa Senhora das Graças. Quando a paróquia definir a programação oficial — novena, missas, procissão, quermesse e demais celebrações — este espaço será atualizado.</p><p>A festa da Padroeira é um tempo de graça, de gratidão e de comunhão. Convidamos todas as famílias a acompanharem os avisos da paróquia.</p>`,
    author: '[EQUIPE DE COMUNICAÇÃO]',
    date: '2026-08-15',
    image: img.mary,
    category: 'Festa da Padroeira',
    gallery: [img.nave, img.candles],
    relatedIds: ['news-2', 'news-3'],
    status: 'published',
    featured: true,
    galleryMediaIds: [],
    showProgress: false,
    progressCurrent: 0,
    progressGoal: 0,
  },
  {
    id: 'news-2',
    slug: 'retiro-paroquial',
    title: 'Retiro paroquial: um tempo para escutar o Senhor',
    excerpt:
      'Notícia demonstrativa sobre o retiro da comunidade. Local, tema e inscrições serão divulgados.',
    content: `<p>Conteúdo demonstrativo. O retiro paroquial é uma oportunidade de silêncio, Palavra e partilha. Informações reais de data, local e inscrição serão cadastradas no painel administrativo.</p>`,
    author: '[EQUIPE DE COMUNICAÇÃO]',
    date: '2026-08-10',
    image: img.candles,
    category: 'Formação',
    relatedIds: ['news-1', 'news-4'],
    status: 'published',
    featured: false,
  },
  {
    id: 'news-3',
    slug: 'primeira-eucaristia',
    title: 'Caminho da Primeira Eucaristia',
    excerpt:
      'A catequese prepara as crianças para o encontro com Jesus na Eucaristia. Texto demonstrativo.',
    content: `<p>Notícia demonstrativa sobre a Primeira Eucaristia. Datas de inscrição, documentos e celebração serão informados pela Pastoral da Catequese.</p>`,
    author: '[CATEQUESE]',
    date: '2026-08-05',
    image: img.altar,
    category: 'Sacramentos',
    relatedIds: ['news-5'],
    status: 'published',
    featured: false,
  },
  {
    id: 'news-4',
    slug: 'encontro-de-jovens',
    title: 'Juventude em missão',
    excerpt:
      'Encontro demonstrativo da Pastoral da Juventude. Venha fazer parte quando as atividades forem confirmadas.',
    content: `<p>Texto demonstrativo sobre a juventude da paróquia. Horários de reunião e próximos encontros serão publicados na agenda.</p>`,
    author: '[PASTORAL DA JUVENTUDE]',
    date: '2026-07-28',
    image: img.youth,
    category: 'Juventude',
    relatedIds: ['news-2'],
    status: 'published',
    featured: false,
  },
  {
    id: 'news-5',
    slug: 'acao-social',
    title: 'Ação social: fé que se faz serviço',
    excerpt:
      'A comunidade se organiza para servir os mais necessitados. Campanha demonstrativa.',
    content: `<p>Notícia demonstrativa de ação social. Pontos de coleta, voluntariado e parcerias serão detalhados pela pastoral responsável.</p>`,
    author: '[AÇÃO SOCIAL]',
    date: '2026-07-20',
    image: img.hands,
    category: 'Ação social',
    relatedIds: ['news-1'],
    status: 'published',
    featured: false,
  },
  {
    id: 'news-6',
    slug: 'crisma',
    title: 'Crisma: fortalecidos pelo Espírito Santo',
    excerpt:
      'Informações demonstrativas sobre o itinerário da Crisma na paróquia.',
    content: `<p>Conteúdo demonstrativo. O sacramento da Confirmação será apresentado com requisitos, encontros e data da celebração quando definidos.</p>`,
    author: '[CATEQUESE]',
    date: '2026-07-12',
    image: img.stained,
    category: 'Sacramentos',
    relatedIds: ['news-3'],
    status: 'published',
    featured: false,
  },
]

export const seedPeople: Person[] = [
  {
    id: 'person-padre',
    slug: 'padre',
    name: '[NOME DO PADRE]',
    role: 'Pároco',
    photo: img.portrait,
    bio: 'Biografia demonstrativa. Este espaço apresentará a trajetória pastoral do pároco, sua ordenação e o serviço nesta comunidade. Nenhuma informação pessoal real foi inventada.',
    quote: '[MENSAGEM DO PÁROCO — A DEFINIR]',
    attendance: '[HORÁRIO DE ATENDIMENTO DO PÁROCO]',
    type: 'padre',
  },
  {
    id: 'person-diacono',
    slug: 'diacono',
    name: '[NOME DO DIÁCONO]',
    role: 'Diácono permanente',
    photo: img.choir,
    bio: 'Biografia demonstrativa. Aqui será descrita a atuação do diácono na liturgia, na caridade e no anúncio. Dados reais serão inseridos pela paróquia.',
    ministry: '[ATUAÇÃO NA COMUNIDADE — A DEFINIR]',
    type: 'diacono',
  },
]

export const seedPastorals: Pastoral[] = [
  {
    id: 'past-1',
    slug: 'liturgia',
    name: 'Pastoral da Liturgia',
    description:
      'Exemplo cadastrado para demonstração. A Pastoral da Liturgia cuida da beleza e da dignidade das celebrações. Equipe, horários e contato reais serão definidos pela paróquia.',
    image: img.altar,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
  {
    id: 'past-2',
    slug: 'catequese',
    name: 'Pastoral da Catequese',
    description:
      'Exemplo demonstrativo. A Catequese acompanha crianças, jovens e famílias no caminho da fé e dos sacramentos.',
    image: img.community,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
  {
    id: 'past-3',
    slug: 'juventude',
    name: 'Pastoral da Juventude',
    description:
      'Exemplo demonstrativo. Espaço para jovens viverem a fé, a amizade e a missão.',
    image: img.youth,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
  {
    id: 'past-4',
    slug: 'familiar',
    name: 'Pastoral Familiar',
    description:
      'Exemplo demonstrativo. Acolhida e acompanhamento das famílias da comunidade.',
    image: img.hands,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
  {
    id: 'past-5',
    slug: 'dizimo',
    name: 'Pastoral do Dízimo',
    description:
      'Exemplo demonstrativo. Educação para a partilha e a corresponsabilidade com a missão da paróquia.',
    image: img.nave,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
  {
    id: 'past-6',
    slug: 'acao-social',
    name: 'Ação Social',
    description:
      'Exemplo demonstrativo. Serviço aos irmãos em situação de vulnerabilidade.',
    image: img.hands,
    responsible: '[RESPONSÁVEL]',
    contact: '[CONTATO]',
    meetingTime: '[HORÁRIO DE REUNIÃO]',
    location: '[LOCAL]',
    active: true,
  },
]

export const seedSacraments: Sacrament[] = [
  {
    id: 'sac-batismo',
    slug: 'batismo',
    name: 'Batismo',
    summary: 'O primeiro sacramento da iniciação cristã, porta da vida na Igreja.',
    whatItIs:
      'Pelo Batismo, a pessoa é mergulhada na morte e ressurreição de Cristo, torna-se filha de Deus e membro da Igreja.',
    whoCanReceive:
      'Crianças, por pedido dos pais e padrinhos, e adultos após o catecumenato. Critérios pastorais locais serão informados pela secretaria.',
    howItWorks:
      'Procure a secretaria para agendar conversa, encontro de preparação e data da celebração. Procedimento local: [A CONFIRMAR].',
    documents: ['[DOCUMENTOS NECESSÁRIOS — A DEFINIR]'],
    howToRegister: 'Inscrição pela secretaria paroquial. [PROCEDIMENTO — A DEFINIR]',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-eucaristia',
    slug: 'primeira-eucaristia',
    name: 'Primeira Eucaristia',
    summary: 'O encontro com Jesus no pão e no vinho consagrados.',
    whatItIs:
      'A Eucaristia é o sacramento do Corpo e do Sangue de Cristo, memorial da Páscoa e centro da vida cristã.',
    whoCanReceive:
      'Crianças e adolescentes que concluíram o itinerário catequético definido pela paróquia, e adultos em processo próprio.',
    howItWorks:
      'Participação da catequese, encontros com as famílias e celebração comunitária. Detalhes locais: [A CONFIRMAR].',
    documents: ['[DOCUMENTOS NECESSÁRIOS — A DEFINIR]'],
    howToRegister: 'Procure a Pastoral da Catequese ou a secretaria.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-crisma',
    slug: 'crisma',
    name: 'Crisma',
    summary: 'A Confirmação, que sela o batizado com o dom do Espírito Santo.',
    whatItIs:
      'A Crisma confirma e fortalece a graça batismal pelo Espírito Santo, para o testemunho cristão.',
    whoCanReceive:
      'Batizados que concluíram a preparação definida pela diocese e pela paróquia.',
    howItWorks:
      'Itinerário de encontros, acompanhamento e celebração com o bispo ou delegado. [A CONFIRMAR]',
    documents: ['[DOCUMENTOS NECESSÁRIOS — A DEFINIR]'],
    howToRegister: 'Inscrições divulgadas periodicamente pela catequese.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-confissao',
    slug: 'confissao',
    name: 'Confissão',
    summary: 'O sacramento da Reconciliação, encontro com a misericórdia de Deus.',
    whatItIs:
      'Na Confissão, o penitente reconhece o pecado, pede perdão e recebe a absolvição, reconciliando-se com Deus e com a Igreja.',
    whoCanReceive: 'Todo batizado que deseja se reconciliar, com as devidas disposições.',
    howItWorks:
      'Horários de atendimento serão publicados na agenda. Em caso de necessidade, procure a secretaria. [HORÁRIOS — A DEFINIR]',
    documents: ['Não há documentos específicos.'],
    howToRegister: 'Não é necessária inscrição prévia, salvo campanhas comunitárias.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-matrimonio',
    slug: 'matrimonio',
    name: 'Matrimônio',
    summary: 'A aliança de amor entre um homem e uma mulher, sacramento de Cristo e da Igreja.',
    whatItIs:
      'O Matrimônio une os esposos em uma aliança indissolúvel, sinal do amor de Cristo pela Igreja.',
    whoCanReceive:
      'Noivos livres para contrair matrimônio, após processo de habilitação e preparação.',
    howItWorks:
      'Inicie o processo com antecedência na secretaria. Haverá encontros de preparação e documentação canônica. [PRAZOS — A DEFINIR]',
    documents: ['[DOCUMENTOS NECESSÁRIOS — A DEFINIR]'],
    howToRegister: 'Agende atendimento na secretaria paroquial.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-uncao',
    slug: 'uncao-dos-enfermos',
    name: 'Unção dos Enfermos',
    summary: 'O sacramento que conforta os doentes com a graça de Cristo.',
    whatItIs:
      'A Unção dos Enfermos une o doente à paixão de Cristo, trazendo conforto, paz e, se for a vontade de Deus, o restabelecimento.',
    whoCanReceive:
      'Fiéis em enfermidade grave, idade avançada ou diante de cirurgia importante.',
    howItWorks:
      'Solicite à secretaria ou ao pároco. Em urgência, use os canais de contato da paróquia. [A CONFIRMAR]',
    documents: ['Informar situação de saúde e local de atendimento.'],
    howToRegister: 'Pedido pela família, hospital ou secretaria.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
  {
    id: 'sac-ordem',
    slug: 'ordem',
    name: 'Ordem',
    summary: 'O sacramento do serviço apostólico: diáconos, presbíteros e bispos.',
    whatItIs:
      'O sacramento da Ordem configura o homem a Cristo servo e pastor, para o ministério na Igreja.',
    whoCanReceive:
      'Candidatos chamados e aprovados pela Igreja, segundo as normas diocesanas.',
    howItWorks:
      'O discernimento vocacional é acompanhado pela diocese e pela paróquia. Procure o pároco para uma conversa inicial.',
    documents: ['Processo vocacional diocesano.'],
    howToRegister: 'Converse com o pároco e com o serviço vocacional da diocese.',
    secretaryContact: '[CONTATO DA SECRETARIA]',
  },
]

export const seedGallery: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Igreja Matriz (imagem demonstrativa)',
    src: img.church,
    alt: 'Interior iluminado de uma igreja católica — imagem demonstrativa',
    category: 'missas',
    date: '2026-08-01',
  },
  {
    id: 'gal-2',
    title: 'Nave (imagem demonstrativa)',
    src: img.nave,
    alt: 'Nave de igreja com bancos de madeira — imagem demonstrativa',
    category: 'missas',
    date: '2026-08-01',
  },
  {
    id: 'gal-3',
    title: 'Vitrais (imagem demonstrativa)',
    src: img.stained,
    alt: 'Vitral colorido de igreja — imagem demonstrativa',
    category: 'eventos',
    date: '2026-07-20',
  },
  {
    id: 'gal-4',
    title: 'Velas (imagem demonstrativa)',
    src: img.candles,
    alt: 'Velas acesas em ambiente de oração — imagem demonstrativa',
    category: 'festa-padroeira',
    date: '2026-07-10',
  },
  {
    id: 'gal-5',
    title: 'Altar (imagem demonstrativa)',
    src: img.altar,
    alt: 'Altar preparado para a celebração — imagem demonstrativa',
    category: 'semana-santa',
    date: '2026-04-02',
  },
  {
    id: 'gal-6',
    title: 'Comunidade (imagem demonstrativa)',
    src: img.community,
    alt: 'Pessoas reunidas em comunidade — imagem demonstrativa',
    category: 'pastorais',
    date: '2026-06-15',
  },
  {
    id: 'gal-7',
    title: 'Juventude (imagem demonstrativa)',
    src: img.youth,
    alt: 'Jovens em momento de encontro — imagem demonstrativa',
    category: 'juventude',
    date: '2026-06-01',
  },
  {
    id: 'gal-8',
    title: 'Solidariedade (imagem demonstrativa)',
    src: img.hands,
    alt: 'Mãos unidas em gesto de solidariedade — imagem demonstrativa',
    category: 'acoes-sociais',
    date: '2026-05-20',
  },
]

export const seedPrayers: PrayerRequest[] = [
  {
    id: 'prayer-1',
    name: 'Anônimo',
    request: 'Pedido demonstrativo: pela saúde das famílias da paróquia.',
    anonymous: true,
    createdAt: '2026-08-22T10:00:00',
    status: 'new',
  },
]

export const seedMessages: ContactMessage[] = [
  {
    id: 'msg-1',
    name: '[NOME]',
    email: '[E-MAIL]',
    phone: '[TELEFONE]',
    subject: 'Mensagem demonstrativa',
    message: 'Esta é uma mensagem de exemplo recebida pelo formulário de contato.',
    createdAt: '2026-08-21T14:00:00',
    status: 'new',
  },
]

export const heroImage = img.church
export const images = img
