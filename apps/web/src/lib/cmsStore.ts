import {
  defaultFeast,
  defaultSettings,
  seedEvents,
  seedGallery,
  seedMasses,
  seedMessages,
  seedNews,
  seedNotices,
  seedPastorals,
  seedPeople,
  seedPrayers,
  seedSacraments,
} from '@/data/mocks'
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

const STORAGE_KEY = 'pnsgracas-cms-v1'

export interface CmsState {
  settings: ParishSettings
  feast: PatronFeast
  notices: Notice[]
  masses: Mass[]
  events: ParishEvent[]
  news: NewsArticle[]
  people: Person[]
  pastorals: Pastoral[]
  sacraments: Sacrament[]
  gallery: GalleryItem[]
  prayers: PrayerRequest[]
  messages: ContactMessage[]
}

const seedState = (): CmsState => ({
  settings: defaultSettings,
  feast: defaultFeast,
  notices: seedNotices,
  masses: seedMasses,
  events: seedEvents,
  news: seedNews,
  people: seedPeople,
  pastorals: seedPastorals,
  sacraments: seedSacraments,
  gallery: seedGallery,
  prayers: seedPrayers,
  messages: seedMessages,
})

let memory = seedState()

function read(): CmsState {
  if (typeof window === 'undefined') return memory
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      memory = seedState()
      return memory
    }
    memory = { ...seedState(), ...(JSON.parse(raw) as Partial<CmsState>) }
    return memory
  } catch {
    memory = seedState()
    return memory
  }
}

function write(next: CmsState) {
  memory = next
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('cms:update'))
}

export function getCmsState() {
  return read()
}

export function setCmsState(updater: (current: CmsState) => CmsState) {
  write(updater(read()))
}

export function subscribeCms(listener: () => void) {
  const handler = () => listener()
  window.addEventListener('cms:update', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('cms:update', handler)
    window.removeEventListener('storage', handler)
  }
}

export function resetCms() {
  write(seedState())
}
