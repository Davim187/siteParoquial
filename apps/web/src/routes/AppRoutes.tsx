import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Loading } from '@/components/ui/Feedback'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const ParishPage = lazy(() => import('@/pages/ParishPage').then((m) => ({ default: m.ParishPage })))
const PersonDetailPage = lazy(() =>
  import('@/pages/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage })),
)
const NewsPage = lazy(() => import('@/pages/NewsPage').then((m) => ({ default: m.NewsPage })))
const NewsDetailPage = lazy(() =>
  import('@/pages/NewsDetailPage').then((m) => ({ default: m.NewsDetailPage })),
)
const NoticesPage = lazy(() => import('@/pages/NoticesPage').then((m) => ({ default: m.NoticesPage })))
const MassesPage = lazy(() => import('@/pages/MassesPage').then((m) => ({ default: m.MassesPage })))
const AgendaPage = lazy(() => import('@/pages/AgendaPage').then((m) => ({ default: m.AgendaPage })))
const PastoralsPage = lazy(() =>
  import('@/pages/PastoralsPage').then((m) => ({ default: m.PastoralsPage })),
)
const PastoralDetailPage = lazy(() =>
  import('@/pages/PastoralDetailPage').then((m) => ({ default: m.PastoralDetailPage })),
)
const SacramentsPage = lazy(() =>
  import('@/pages/SacramentsPage').then((m) => ({ default: m.SacramentsPage })),
)
const SacramentDetailPage = lazy(() =>
  import('@/pages/SacramentDetailPage').then((m) => ({ default: m.SacramentDetailPage })),
)
const GalleryPage = lazy(() => import('@/pages/GalleryPage').then((m) => ({ default: m.GalleryPage })))
const GalleryAlbumPage = lazy(() =>
  import('@/pages/GalleryAlbumPage').then((m) => ({ default: m.GalleryAlbumPage })),
)
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const PrayerPage = lazy(() => import('@/pages/PrayerPage').then((m) => ({ default: m.PrayerPage })))
const DonatePage = lazy(() => import('@/pages/DonatePage').then((m) => ({ default: m.DonatePage })))
const ParticipatePage = lazy(() =>
  import('@/pages/ParticipatePage').then((m) => ({ default: m.ParticipatePage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/ParticipatePage').then((m) => ({ default: m.NotFoundPage })),
)

const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const AdminNewsPage = lazy(() =>
  import('@/pages/admin/AdminNewsPage').then((m) => ({ default: m.AdminNewsPage })),
)
const AdminNoticesPage = lazy(() =>
  import('@/pages/admin/AdminNoticesPage').then((m) => ({ default: m.AdminNoticesPage })),
)
const AdminAgendaPage = lazy(() =>
  import('@/pages/admin/AdminAgendaPage').then((m) => ({ default: m.AdminAgendaPage })),
)
const AdminMassesPage = lazy(() =>
  import('@/pages/admin/AdminAgendaPage').then((m) => ({ default: m.AdminMassesPage })),
)
const AdminPastoralsPage = lazy(() =>
  import('@/pages/admin/AdminPastoralsPage').then((m) => ({ default: m.AdminPastoralsPage })),
)
const AdminSacramentsPage = lazy(() =>
  import('@/pages/admin/AdminSacramentsPage').then((m) => ({ default: m.AdminSacramentsPage })),
)
const AdminGalleryPage = lazy(() =>
  import('@/pages/admin/AdminGalleryPage').then((m) => ({ default: m.AdminGalleryPage })),
)
const AdminPeoplePage = lazy(() =>
  import('@/pages/admin/AdminPeoplePage').then((m) => ({ default: m.AdminPeoplePage })),
)
const AdminPrayersPage = lazy(() =>
  import('@/pages/admin/AdminPrayersPage').then((m) => ({ default: m.AdminPrayersPage })),
)
const AdminMessagesPage = lazy(() =>
  import('@/pages/admin/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage })),
)
const AdminFeastPage = lazy(() =>
  import('@/pages/admin/AdminFeastPage').then((m) => ({ default: m.AdminFeastPage })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
)
const AdminMediaPage = lazy(() =>
  import('@/pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminRolesPage = lazy(() =>
  import('@/pages/admin/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })),
)
const AdminProfilePage = lazy(() =>
  import('@/pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage })),
)

function Suspend({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading label="Carregando página..." />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          index
          element={
            <Suspend>
              <HomePage />
            </Suspend>
          }
        />
        <Route
          path="nossa-paroquia"
          element={
            <Suspend>
              <ParishPage />
            </Suspend>
          }
        />
        <Route
          path="nossa-paroquia/padre"
          element={
            <Suspend>
              <PersonDetailPage forcedSlug="padre" />
            </Suspend>
          }
        />
        <Route
          path="nossa-paroquia/diacono"
          element={
            <Suspend>
              <PersonDetailPage forcedSlug="diacono" />
            </Suspend>
          }
        />
        <Route
          path="noticias"
          element={
            <Suspend>
              <NewsPage />
            </Suspend>
          }
        />
        <Route
          path="noticias/:slug"
          element={
            <Suspend>
              <NewsDetailPage />
            </Suspend>
          }
        />
        <Route
          path="avisos"
          element={
            <Suspend>
              <NoticesPage />
            </Suspend>
          }
        />
        <Route
          path="missas"
          element={
            <Suspend>
              <MassesPage />
            </Suspend>
          }
        />
        <Route
          path="agenda"
          element={
            <Suspend>
              <AgendaPage />
            </Suspend>
          }
        />
        <Route
          path="pastorais"
          element={
            <Suspend>
              <PastoralsPage />
            </Suspend>
          }
        />
        <Route
          path="pastorais/:slug"
          element={
            <Suspend>
              <PastoralDetailPage />
            </Suspend>
          }
        />
        <Route
          path="sacramentos"
          element={
            <Suspend>
              <SacramentsPage />
            </Suspend>
          }
        />
        <Route
          path="sacramentos/:slug"
          element={
            <Suspend>
              <SacramentDetailPage />
            </Suspend>
          }
        />
        <Route
          path="galeria"
          element={
            <Suspend>
              <GalleryPage />
            </Suspend>
          }
        />
        <Route
          path="galeria/:slug"
          element={
            <Suspend>
              <GalleryAlbumPage />
            </Suspend>
          }
        />
        <Route
          path="contato"
          element={
            <Suspend>
              <ContactPage />
            </Suspend>
          }
        />
        <Route
          path="oracao"
          element={
            <Suspend>
              <PrayerPage />
            </Suspend>
          }
        />
        <Route
          path="dizimo"
          element={
            <Suspend>
              <DonatePage />
            </Suspend>
          }
        />
        <Route
          path="participar"
          element={
            <Suspend>
              <ParticipatePage />
            </Suspend>
          }
        />
        <Route
          path="*"
          element={
            <Suspend>
              <NotFoundPage />
            </Suspend>
          }
        />
      </Route>

      <Route
        path="/admin/login"
        element={
          <Suspend>
            <AdminLoginPage />
          </Suspend>
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={
            <Suspend>
              <AdminDashboardPage />
            </Suspend>
          }
        />
        <Route
          path="noticias"
          element={
            <Suspend>
              <AdminNewsPage />
            </Suspend>
          }
        />
        <Route
          path="avisos"
          element={
            <Suspend>
              <AdminNoticesPage />
            </Suspend>
          }
        />
        <Route
          path="agenda"
          element={
            <Suspend>
              <AdminAgendaPage />
            </Suspend>
          }
        />
        <Route
          path="missas"
          element={
            <Suspend>
              <AdminMassesPage />
            </Suspend>
          }
        />
        <Route
          path="pastorais"
          element={
            <Suspend>
              <AdminPastoralsPage />
            </Suspend>
          }
        />
        <Route
          path="sacramentos"
          element={
            <Suspend>
              <AdminSacramentsPage />
            </Suspend>
          }
        />
        <Route
          path="galeria"
          element={
            <Suspend>
              <AdminGalleryPage />
            </Suspend>
          }
        />
        <Route
          path="pessoas"
          element={
            <Suspend>
              <AdminPeoplePage />
            </Suspend>
          }
        />
        <Route
          path="oracoes"
          element={
            <Suspend>
              <AdminPrayersPage />
            </Suspend>
          }
        />
        <Route
          path="mensagens"
          element={
            <Suspend>
              <AdminMessagesPage />
            </Suspend>
          }
        />
        <Route
          path="festa"
          element={
            <Suspend>
              <AdminFeastPage />
            </Suspend>
          }
        />
        <Route
          path="configuracoes"
          element={
            <Suspend>
              <AdminSettingsPage />
            </Suspend>
          }
        />
        <Route
          path="midia"
          element={
            <Suspend>
              <AdminMediaPage />
            </Suspend>
          }
        />
        <Route
          path="usuarios"
          element={
            <Suspend>
              <AdminUsersPage />
            </Suspend>
          }
        />
        <Route
          path="perfis"
          element={
            <Suspend>
              <AdminRolesPage />
            </Suspend>
          }
        />
        <Route
          path="perfil"
          element={
            <Suspend>
              <AdminProfilePage />
            </Suspend>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
