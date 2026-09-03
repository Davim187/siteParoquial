export type NoticeCategory =
  | 'informativo'
  | 'urgente'
  | 'liturgico'
  | 'evento'
  | 'comunicado'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type EventCategory =
  | 'missa'
  | 'adoracao'
  | 'confissao'
  | 'evento'
  | 'reuniao'
  | 'pastoral'
  | 'formacao'
  | 'festa'
  | 'celebracao-especial'

export type GalleryCategory =
  | 'missas'
  | 'eventos'
  | 'festa-padroeira'
  | 'semana-santa'
  | 'catequese'
  | 'juventude'
  | 'pastorais'
  | 'acoes-sociais'

export interface Notice {
  id: string
  title: string
  description: string
  date: string
  image?: string
  category: NoticeCategory
  featured: boolean
  status: ContentStatus
}

export interface ParishEvent {
  id: string
  title: string
  date: string
  time: string
  endTime?: string
  location: string
  description: string
  image?: string
  category: EventCategory
  responsible?: string
  externalUrl?: string
}

export interface Mass {
  id: string
  weekday: string
  date: string
  time: string
  type: string
  location: string
  notes?: string
  isToday?: boolean
  isTomorrow?: boolean
  isNext?: boolean
}

export interface NewsArticle {
  id: string
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  content: string
  author: string
  date: string
  image: string
  category: string
  relatedIds?: string[]
  status: ContentStatus
  featured: boolean
  gallery?: string[]
  galleryMediaIds?: string[]
  showProgress?: boolean
  progressLabel?: string
  progressCurrent?: number
  progressGoal?: number
}

export interface Person {
  id: string
  slug: string
  name: string
  role: string
  photo: string
  photoId?: string | null
  bio: string
  quote?: string
  ministry?: string
  attendance?: string
  type: 'padre' | 'diacono' | 'coordenacao'
}

export interface Pastoral {
  id: string
  slug: string
  name: string
  description: string
  image: string
  responsible: string
  contact: string
  meetingTime: string
  location: string
  social?: {
    instagram?: string
    facebook?: string
  }
  active: boolean
}

export interface Sacrament {
  id: string
  slug: string
  name: string
  summary: string
  whatItIs: string
  whoCanReceive: string
  howItWorks: string
  documents: string[]
  howToRegister: string
  secretaryContact: string
}

export interface GalleryItem {
  id: string
  title: string
  src: string
  alt: string
  category: GalleryCategory
  date: string
}

export interface GalleryPhoto {
  id: string
  albumId: string
  mediaId: string
  title?: string
  description?: string
  sortOrder: number
  url: string
  thumbUrl: string
  originalName?: string
  createdAt: string
}

export interface GalleryAlbum {
  id: string
  title: string
  slug: string
  description?: string
  coverMediaId?: string
  coverUrl: string
  coverThumbUrl: string
  eventDate: string
  active: boolean
  sortOrder: number
  photoCount: number
  createdAt: string
  updatedAt?: string
  photos?: GalleryPhoto[]
}

export interface Paginated<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PrayerRequest {
  id: string
  name: string
  email?: string
  request: string
  anonymous: boolean
  createdAt: string
  status: 'new' | 'prayed' | 'archived'
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  createdAt: string
  status: 'new' | 'read' | 'replied'
}

export interface FeastProgramItem {
  id: string
  date: string
  time: string
  title: string
  description: string
  type: 'novena' | 'missa' | 'procissao' | 'evento' | 'show' | 'quermesse'
}

export interface PatronFeast {
  enabled: boolean
  title: string
  dateLabel: string
  description: string
  program: FeastProgramItem[]
}

export interface ParishSettings {
  name: string
  slogan: string
  welcomeText: string
  address: string
  phone: string
  whatsapp: string
  email: string
  instagram: string
  facebook: string
  youtube: string
  secretaryHours: string
  mapsUrl: string
  pixKey: string
  bankDetails: string
  streamingUrl: string
  history: string
  mission: string
  vision: string
  patroness: {
    name: string
    history: string
    devotion: string
    medal: string
    feast: string
    traditions: string
    image: string
  }
}
